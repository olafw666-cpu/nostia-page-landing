import { el, mount, formatDate } from '../ui/dom.js';
import { spinner, errorState, emptyState, section, pill, statusPill, notice } from '../ui/components.js';

/**
 * Authoring — build an adventure, anchor its stops, approve them, publish.
 *
 * WHY THIS IS HERE AT ALL. Authoring was designed as a mobile job, and the reason is good: the
 * person anchoring a stop should be standing at it, phone in hand, taking the reference photo of
 * the thing they are describing. That has not changed.
 *
 * What changed is that it was the ONLY authoring surface, which left a customer with no way to
 * start work at a desk — writing the walk, drafting the stops, fixing a typo in a title — and no
 * way to do any of it without the app installed. This screen covers that half. Coordinates can be
 * typed here, but the mobile editor is still the right place to capture them.
 *
 * EVERY RULE BELOW IS THE SERVER'S. Approval clearing on edit, publish preflight, tier limits and
 * immutability of a published adventure are all enforced server-side and merely REPORTED here. If
 * this file and the server ever disagree, the server is right.
 */
export async function renderAuthoring(root, { session, navigate, params }) {
  if (params.adventure) return renderEditor(root, { session, navigate, params });
  return renderList(root, { session, navigate, params });
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

async function renderList(root, { session, navigate, params }) {
  mount(root, spinner('Loading adventures'));

  let adventures;
  try {
    adventures = await session.backend.listAdventures(session.orgId);
  } catch (error) {
    mount(root, errorState(error, {
      onRetry: () => renderList(root, { session, navigate, params }),
      onBilling: () => navigate('billing'),
    }));
    return;
  }

  const page = el('div');
  page.append(el('h1', { text: 'Adventures' }));
  page.append(el('p', { class: 'lede', text: 'Write the walk here; anchor the stops on foot.' }));

  const createRow = el('div', { class: 'row', style: { gap: '8px', marginBottom: '18px' } });
  const titleInput = el('input', { type: 'text', placeholder: 'New adventure title', 'aria-label': 'New adventure title' });
  const createButton = el('button', { class: 'btn', text: 'Create draft' });
  const createError = el('div');

  createButton.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }
    createButton.disabled = true;
    createButton.textContent = 'Creating…';
    mount(createError);
    try {
      const created = await session.backend.createAdventure(session.orgId, { title });
      navigate('authoring', { adventure: created.id });
    } catch (error) {
      // A tier limit is a 402 and belongs on the billing screen, not in a red box.
      mount(createError, errorState(error, { onBilling: () => navigate('billing') }));
      createButton.disabled = false;
      createButton.textContent = 'Create draft';
    }
  });

  createRow.append(titleInput, createButton);
  page.append(createRow, createError);

  if (!adventures.length) {
    page.append(emptyState('No adventures yet',
      'Create a draft above, add the stops you want people to visit, then publish it when every stop is approved.'));
    mount(root, page);
    return;
  }

  const list = el('div');
  for (const adventure of adventures) {
    list.append(el('div', {
      class: 'list-item',
      onClick: () => navigate('authoring', { adventure: adventure.id }),
    },
    el('div', {},
      el('div', { class: 'title', text: adventure.title }),
      el('div', { class: 'meta' },
        statusPill(adventure.status),
        el('span', { text: `version ${adventure.version}` }),
        formatDate(adventure.updated_at)
          ? el('span', { text: `edited ${formatDate(adventure.updated_at)}` })
          : null)),
    el('div', { class: 'figure' }, '›')));
  }
  page.append(section('All adventures', null, list));
  mount(root, page);
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

async function renderEditor(root, { session, navigate, params }) {
  mount(root, spinner('Loading adventure'));
  const reload = () => renderEditor(root, { session, navigate, params });

  let data;
  try {
    data = await session.backend.loadAdventure(session.orgId, params.adventure);
  } catch (error) {
    mount(root, errorState(error, { onRetry: reload, onBilling: () => navigate('billing') }));
    return;
  }

  const { adventure, steps, preflightFailures } = data;
  const editable = adventure.status === 'draft';
  const page = el('div');

  page.append(el('button', {
    class: 'btn link', text: '‹ All adventures', onClick: () => navigate('authoring'),
  }));
  page.append(el('h1', { text: adventure.title }));
  page.append(el('div', { class: 'meta' },
    statusPill(adventure.status),
    el('span', { text: `version ${adventure.version}` }),
    el('span', { text: `${steps.length} ${steps.length === 1 ? 'stop' : 'stops'}` })));

  // A published adventure is immutable, and that is a feature: somebody may be standing at stop
  // three right now. Editing means creating a new version.
  if (!editable) {
    page.append(notice('info', 'This version is live and cannot be edited',
      'Someone could be walking it right now. Create a new version to make changes — the live one keeps working until you publish the replacement.',
      session.isOwner || adventure.status === 'draft' ? {
        label: 'Create a new version',
        onClick: async () => {
          const revision = await session.backend.reviseAdventure(session.orgId, adventure.id);
          navigate('authoring', { adventure: revision.id });
        },
      } : null));
  }

  page.append(detailsCard(session, adventure, { editable, onSaved: reload }));
  page.append(stopsSection(session, adventure, steps, { editable, onChanged: reload }));
  page.append(publishSection(session, adventure, preflightFailures, { navigate, onChanged: reload }));

  mount(root, page);
}

function detailsCard(session, adventure, { editable, onSaved }) {
  const title = el('input', { type: 'text', value: adventure.title ?? '', disabled: !editable });
  const description = el('textarea', { rows: '3', disabled: !editable });
  description.value = adventure.description ?? '';

  const difficulty = el('select', { disabled: !editable });
  for (const value of ['easy', 'medium', 'advanced']) {
    const option = el('option', { value, text: value });
    if (value === adventure.difficulty) option.selected = true;
    difficulty.append(option);
  }

  const status = el('div');
  const save = el('button', { class: 'btn', text: 'Save', disabled: !editable });

  save.addEventListener('click', async () => {
    save.disabled = true;
    save.textContent = 'Saving…';
    mount(status);
    try {
      await session.backend.updateAdventure(session.orgId, adventure.id, {
        title: title.value.trim(),
        description: description.value,
        difficulty: difficulty.value,
      });
      onSaved();
    } catch (error) {
      mount(status, errorState(error));
      save.disabled = false;
      save.textContent = 'Save';
    }
  });

  return section('Details', null, el('div', { class: 'card' },
    field('Title', title),
    field('Description', description),
    field('Difficulty', difficulty),
    status,
    editable ? save : null));
}

function stopsSection(session, adventure, steps, { editable, onChanged }) {
  const list = el('div');
  for (const step of steps) list.append(stopCard(session, adventure, step, { editable, onChanged }));

  const addStatus = el('div');
  const addTitle = el('input', { type: 'text', placeholder: 'Stop title', 'aria-label': 'New stop title' });
  const addButton = el('button', { class: 'btn', text: 'Add stop' });

  addButton.addEventListener('click', async () => {
    const value = addTitle.value.trim();
    if (!value) { addTitle.focus(); return; }
    addButton.disabled = true;
    addButton.textContent = 'Adding…';
    mount(addStatus);
    try {
      await session.backend.addStep(session.orgId, adventure.id, {
        title: value,
        text: value,
        verify_criterion: '',
      });
      onChanged();
    } catch (error) {
      mount(addStatus, errorState(error));
      addButton.disabled = false;
      addButton.textContent = 'Add stop';
    }
  });

  return section('Stops', 'People visit these in order. Each one has to be approved before the adventure can go live.',
    steps.length ? list : emptyState('No stops yet', 'An adventure needs at least one stop before it can be published.'),
    editable
      ? el('div', { class: 'card' },
          el('div', { class: 'row', style: { gap: '8px' } }, addTitle, addButton), addStatus)
      : null);
}

function stopCard(session, adventure, step, { editable, onChanged }) {
  const card = el('div', { class: 'card' });
  const status = el('div');

  const approved = Boolean(step.approved_at);
  card.append(el('div', { class: 'meta' },
    el('span', { class: 'funnel-ord', text: String(step.order) }),
    el('strong', { text: step.title || 'Untitled stop' }),
    approved ? pill('Approved', 'ok') : pill('Needs approval', 'warn'),
    step.has_reference ? pill('Reference photo', 'info') : null));

  const text = el('textarea', { rows: '2', disabled: !editable });
  text.value = step.text ?? '';
  const criterion = el('input', { type: 'text', value: step.verify_criterion ?? '', disabled: !editable });
  const lat = el('input', { type: 'number', step: 'any', value: step.lat ?? '', disabled: !editable });
  const lng = el('input', { type: 'number', step: 'any', value: step.lng ?? '', disabled: !editable });
  const radius = el('input', { type: 'number', value: step.geofence_radius_m ?? 100, disabled: !editable });
  const dwell = el('input', { type: 'number', value: step.dwell_seconds ?? 90, disabled: !editable });

  card.append(
    field('What the visitor sees', text),
    field('Photo criterion', criterion),
    el('div', { class: 'row', style: { gap: '8px' } },
      field('Latitude', lat), field('Longitude', lng)),
    el('div', { class: 'row', style: { gap: '8px' } },
      field('Geofence radius (m)', radius), field('Dwell (seconds)', dwell)));

  if (editable) {
    const save = el('button', { class: 'btn ghost', text: 'Save stop' });
    save.addEventListener('click', async () => {
      save.disabled = true;
      mount(status);
      try {
        await session.backend.updateStep(session.orgId, adventure.id, step.id, {
          text: text.value,
          verify_criterion: criterion.value.trim(),
          lat: lat.value === '' ? null : Number(lat.value),
          lng: lng.value === '' ? null : Number(lng.value),
          geofence_radius_m: Number(radius.value),
          dwell_seconds: Number(dwell.value),
        });
        onChanged();
      } catch (error) {
        mount(status, errorState(error));
        save.disabled = false;
      }
    });

    // Uploading a reference is an EDIT, so it clears approval like any other —
    // the person approving has to have seen what they are approving.
    const file = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    file.addEventListener('change', async () => {
      if (!file.files?.length) return;
      mount(status, spinner('Uploading reference'));
      try {
        await session.backend.uploadStepReference(session.orgId, adventure.id, step.id, file.files[0]);
        onChanged();
      } catch (error) {
        mount(status, errorState(error));
      }
    });

    const approve = el('button', {
      class: 'btn', text: approved ? 'Approved' : 'Approve this stop', disabled: approved,
    });
    approve.addEventListener('click', async () => {
      approve.disabled = true;
      mount(status);
      try {
        await session.backend.approveStep(session.orgId, adventure.id, step.id);
        onChanged();
      } catch (error) {
        mount(status, errorState(error));
        approve.disabled = false;
      }
    });

    const remove = el('button', { class: 'btn link', text: 'Delete stop' });
    remove.addEventListener('click', async () => {
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Delete stop ${step.order}? This cannot be undone.`)) return;
      mount(status, spinner('Deleting'));
      try {
        await session.backend.deleteStep(session.orgId, adventure.id, step.id);
        onChanged();
      } catch (error) {
        mount(status, errorState(error));
      }
    });

    card.append(
      field(step.has_reference ? 'Replace reference photo' : 'Reference photo', file),
      el('p', { class: 'small muted', text: 'Reference photos are used by the verifier and are never shown to visitors.' }),
      status,
      el('div', { class: 'row', style: { gap: '8px' } }, save, approve, remove));
  } else {
    card.append(status);
  }

  return card;
}

function publishSection(session, adventure, failures, { navigate, onChanged }) {
  const status = el('div');
  const body = el('div', { class: 'card' });

  if (adventure.status === 'draft') {
    if (failures.length) {
      body.append(notice('warn', `Not ready to publish — ${failures.length} ${failures.length === 1 ? 'thing' : 'things'} to fix`,
        'Every stop needs a location, a reference photo where one is required, and an approval.'));
      const list = el('ul');
      for (const failure of failures) {
        list.append(el('li', { text: failure.detail ?? failure.code }));
      }
      body.append(list);
    } else {
      body.append(notice('ok', 'Ready to publish', 'Every stop is anchored and approved.'));
    }

    // Publish is owner-only server-side. An admin gets told who can do it rather
    // than a button that 403s.
    if (session.isOwner) {
      const publish = el('button', {
        class: 'btn', text: 'Publish', disabled: failures.length > 0,
      });
      publish.addEventListener('click', async () => {
        publish.disabled = true;
        publish.textContent = 'Publishing…';
        mount(status);
        try {
          await session.backend.publishAdventure(session.orgId, adventure.id);
          onChanged();
        } catch (error) {
          mount(status, errorState(error, { onBilling: () => navigate('billing') }));
          publish.disabled = false;
          publish.textContent = 'Publish';
        }
      });
      body.append(publish);
    } else {
      body.append(el('p', { class: 'small muted', text: 'Publishing is done by the organization owner.' }));
    }
  } else if (adventure.status === 'published' && session.isOwner) {
    body.append(el('p', { class: 'small muted', text: 'Archiving stops new walkers from starting this. Anyone part-way through keeps their run.' }));
    const archive = el('button', { class: 'btn ghost', text: 'Archive' });
    archive.addEventListener('click', async () => {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Archive this adventure? Printed QR codes pointing at it will stop starting new walks.')) return;
      mount(status, spinner('Archiving'));
      try {
        await session.backend.archiveAdventure(session.orgId, adventure.id);
        onChanged();
      } catch (error) {
        mount(status, errorState(error));
      }
    });
    body.append(archive);
  } else {
    body.append(el('p', { class: 'small muted', text: 'This version is no longer live.' }));
  }

  body.append(status);
  return section('Publishing', null, body);
}

function field(label, control) {
  return el('label', { class: 'field' }, el('span', { text: label }), control);
}
