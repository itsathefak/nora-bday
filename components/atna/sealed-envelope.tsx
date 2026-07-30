"use client";

import { motion } from "framer-motion";

export function SealedEnvelope({ unlocked = false }: { unlocked?: boolean }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0], rotate: unlocked ? 0 : [0, -0.5, 0.4, 0] }}
      transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 7, repeat: Infinity } }}
      className="relative mx-auto aspect-[1.52/1] w-[min(78vw,440px)] [perspective:900px] drop-shadow-[0_28px_44px_rgba(0,0,0,0.7)]"
      aria-label={unlocked ? "An unlocked letter envelope" : "A letter secured with a wax seal"}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[10px] border border-[#d9c7a0]/30 bg-[#cbb88f] shadow-[inset_0_0_60px_rgba(75,45,22,0.28)]">
        <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(8deg,transparent_0,transparent_4px,rgba(75,45,22,.08)_5px)]" />
        <div className="absolute inset-x-0 bottom-0 h-[78%] [clip-path:polygon(0_0,50%_62%,100%_0,100%_100%,0_100%)] bg-[#dfcda5] shadow-[inset_0_8px_20px_rgba(65,34,15,.17)]" />
        <motion.div
          animate={unlocked ? { rotateX: -165, y: -2 } : { rotateX: 0, y: 0 }}
          transition={{ duration: 0.9, delay: unlocked ? 0.25 : 0, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-0 z-10 h-[61%] origin-top [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)] bg-[#ead9b4] shadow-[0_9px_18px_rgba(66,38,18,.25)]"
        />
      </div>

      <motion.div
        animate={unlocked ? { scale: 0.9, rotate: 18, y: 62, opacity: 0 } : { scale: [1, 1.035, 1], opacity: 1 }}
        transition={{ duration: unlocked ? 0.5 : 2.8, repeat: unlocked ? 0 : Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[45%] z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-200/20 bg-[radial-gradient(circle_at_38%_30%,#b63a3a,#761515_58%,#3f0808)] shadow-[0_0_30px_rgba(185,28,28,.4),inset_0_0_0_5px_rgba(75,10,10,.28)]"
      >
        <span className="font-serif text-2xl italic text-red-100/80">A</span>
      </motion.div>

      {!unlocked && (
        <div className="absolute -bottom-8 -right-7 rotate-[24deg] text-[#a88b56] drop-shadow-[0_5px_7px_rgba(0,0,0,.8)]" aria-hidden="true">
          <span className="text-6xl">⚿</span>
        </div>
      )}
    </motion.div>
  );
}
