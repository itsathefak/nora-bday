"use client";

import { AtnaProfileGate } from "../../../components/AtnaUnlockGate";
import { FloatingParticles } from "../../../components/FloatingParticles";
import { Header } from "../../../components/Header";
import { HeroBanner } from "../../../components/HeroBanner";
import { HeartPingSection } from "../../../components/atna/heart-ping-section";
import { SecretLetterSection } from "../../../components/atna/secret-letter-section";
import { SharedInboxSection } from "../../../components/atna/shared-inbox-section";
import { HiddenReminder } from "../../../components/shared/hidden-reminder";
import homeData from "../../../data/atna/home.json";

export default function AtnaProfilePage() {
  return (
    <AtnaProfileGate>
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(127,29,29,0.2),transparent_24%),linear-gradient(to_bottom,#160404,#000_48%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
          <FloatingParticles />
        </div>
        <Header />
        <main className="relative z-[2] pt-24">
          <HeroBanner data={homeData.hero} />
          <SharedInboxSection />
          <HeartPingSection />
          <SecretLetterSection />
          <HiddenReminder profile="atna" />
        </main>
      </div>
    </AtnaProfileGate>
  );
}
