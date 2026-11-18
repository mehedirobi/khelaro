
import { Trophy } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm shadow-green-600/20">
        <Trophy size={22} strokeWidth={2.3} />
      </div>

      <div className="leading-none">
        <span className="block text-[21px] font-extrabold tracking-tight text-gray-950">
          Khelaro
        </span>
        <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.19em] text-gray-400">
          Play. Book. Enjoy.
        </span>
      </div>
    </div>
  );
};

export default Logo;
