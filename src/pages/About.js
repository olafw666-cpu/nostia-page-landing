import React from "react";
import owImage from "../OW.jpg";
import wcImage from "../WC.jpg";

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
    image: wcImage,
    hasImage: true,
    description: "I'm Will. I am a motivated and ambitious person with a lot of goals to create and innovate in the new age of artificial intelligence and the internet. I have experience in leadership and creative thinking along with networking skills that I hope to continue to deploy working with Nostia to create a product that can help shape the future of travel and planning. In my free time I like to ski and go on adventures."
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
