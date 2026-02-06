import React from "react";
import owImage from "../OW.jpg";

// Team member data
const teamMembers = [
  {
    name: "Olaf Woodall",
    role: "Founder",
    image: owImage,
    hasImage: true,
    description: "I am a driven individual driven by a dream of improving humanity via the invention, investment, and improvement of current technology. I have expertise in leadership, ML development, marketing, full stack development. In my free time I like to hike and ski."
  },
  {
    name: "Will Chadwick",
    role: "Co-Founder",
    image: "WC.jpeg",
    description: "Will Chadwick team killed Olaf Woodall in Siege."
  },
  {
    name: "Joey Hannon",
    role: "App Development",
    image: "JH.jpeg",
    description: "Joey Hannon Description"
  },
  {
    name: "Shreya",
    role: "Legal",
    image: "S.jpeg",
    description: "Shreya Description"
  },
  {
    name: "Robbie Settle",
    role: "Front End Developer",
    image: "RS.jpeg",
    description: "Robbie Description"
  }
];

export default function About() {
  return (
    <main className="w-full max-w-5xl flex-1">
      {/* About Us Title */}
      <h2 className="text-4xl font-bold mb-12 text-center">About Us</h2>

      {/* Nostia's Story Section */}
      <section className="mb-20">
        <h3 className="text-2xl font-semibold mb-6 text-center">Nostia's Story</h3>
        <div className="border border-white/10 p-8 rounded-lg bg-white/5">
          <p className="text-white/80 leading-relaxed mb-4">
            Nostia was created out of the failure and hardship of planning a group trip in a large group chat, which quickly descended into chaos and a logistical nightmare. Scattered messages, differing plans, and limited scheduling ultimately detracted from the trip, which everyone had been invested into financially and emotionally.
          </p>
          <p className="text-white/80 leading-relaxed">
            Nostia takes on the responsibility of organizing, budgeting, and scheduling, to streamline your planning, while ensuring clarity. Our mission is to handle the tedious logistics and details behind an adventure to maximize your adventures financially and emotionally.
          </p>
        </div>

        {/* Picture Placeholder */}
        <div className="mt-8 flex justify-center">
          <div className="border border-white/10 p-12 rounded-lg bg-white/5 w-full max-w-2xl text-center">
            <p className="text-white/40">Picture placeholder</p>
          </div>
        </div>
      </section>

      {/* About The Nostia Team Section */}
      <section>
        <h3 className="text-2xl font-semibold mb-8 text-center">About The Nostia Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="border border-white/10 p-6 rounded-lg bg-white/5 text-center">
              {/* Team Member Photo */}
              <div className="w-32 h-32 mx-auto mb-4 rounded-full border border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                {member.hasImage ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white/30 text-xs">{member.image}</span>
                )}
              </div>
              <h4 className="font-semibold text-lg">{member.name}</h4>
              <p className="text-white/60 text-sm mb-3">{member.role}</p>
              <p className="text-white/50 text-sm">{member.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
