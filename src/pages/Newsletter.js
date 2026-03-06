import React from "react";
import logo from "../logo.png";

const linkedInPosts = [
  {
    title: "Why Most Social Apps Fail at Building Real Connections",
    excerpt: "Most social apps focus on likes, followers, and superficial engagement — but real connections are built through shared experiences. At Nostia, we believe travel is one of the most powerful ways to strengthen relationships and create lasting memories with the people who matter most.",
    url: "https://www.linkedin.com/posts/nostia_why-most-social-apps-fail-at-building-real-activity-7425180154307608576-TpqR",
  },
  {
    title: "We're Officially Launching Nostia on Android",
    excerpt: "Big news — Nostia is now available on Android! We've been working hard to bring our group travel planning experience to even more users. Whether you're coordinating a weekend getaway or a cross-country road trip, Nostia makes it easy to plan together.",
    url: "https://www.linkedin.com/posts/nostia_were-officially-launching-nostia-on-android-activity-7422998276909481984-24zf",
  },
  {
    title: "Opening Our First Nostia Beta",
    excerpt: "As we move closer to our full launch, we're excited to open up our first beta to early users. This is a huge milestone for the team, and we can't wait to get real feedback from travelers who are ready to plan their next adventure with friends and family.",
    url: "https://www.linkedin.com/posts/nostia_opening-our-first-nostia-beta-as-we-move-activity-7420812658528030720-eD1e",
  },
  {
    title: "Introducing Nostia",
    excerpt: "Nostia is a social travel platform designed to help friends, families, and groups follow through on their travel plans. With shared calendars, lodging tools, and collaborative budgeting, we're taking the chaos out of group trip planning.",
    url: "https://www.linkedin.com/posts/nostia_introducing-nostia-nostia-is-a-social-travel-activity-7410823713887236096-zEDg",
  },
];

export default function Newsletter() {
  return (
    <main className="w-full max-w-5xl flex-1">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center">Newsletter</h2>
      <p className="text-white/60 text-center mb-8 sm:mb-12 text-sm sm:text-base">
        Stay updated with our latest news and announcements
      </p>

      {/* Social Links */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 mb-10 sm:mb-16">
        <a
          href="https://www.linkedin.com/company/nostia/posts/?feedView=all"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Follow on LinkedIn
        </a>
        <a
          href="https://www.instagram.com/nostiatravel/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Follow on Instagram
        </a>
      </div>

      {/* Posts Section */}
      <div className="space-y-10 sm:space-y-16">
        {/* LinkedIn Posts */}
        <section>
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">LinkedIn Updates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {linkedInPosts.map((post, index) => (
              <a
                key={index}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition overflow-hidden block"
              >
                <div className="bg-[#1a1a1b] p-4 sm:p-6 flex justify-center">
                  <img src={logo} alt="Nostia" className="h-16 sm:h-20 object-contain" />
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-white font-semibold mb-2 text-sm sm:text-base">{post.title}</p>
                  <p className="text-white/50 text-sm mb-3 leading-relaxed">
                    {post.excerpt}{" "}
                    <span className="text-white/70 hover:text-white">Read more...</span>
                  </p>
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>Nostia on LinkedIn</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Instagram Posts */}
        <section>
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">Instagram Updates</h3>
          <div className="flex justify-center">
            <a
              href="https://www.instagram.com/nostiatravel/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/10 p-8 rounded-lg bg-white/5 text-center w-full max-w-md hover:bg-white/10 transition block"
            >
              <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <p className="text-white font-semibold mb-2">View Our Instagram</p>
              <p className="text-white/50 text-sm">Follow @nostiatravel for updates</p>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
