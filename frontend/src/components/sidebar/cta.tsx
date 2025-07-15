import Link from 'next/link';

export function CTACard() {
  return (
    <div className="rounded-2xl border border-[#FFFFFF33] p-3 flex flex-col gap-3 transition-all">
      {/* Title */}
      <div className="text-[13px] font-medium leading-4 text-white">
        Tokens Used
      </div>
      {/* Description */}
      <div className="text-[12px] font-light leading-4 text-[#FFFFFF66]">
        Your team has used 80% of your credits. Need more?
      </div>
      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-[#FFFFFF1A] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: '80%',
            background: 'linear-gradient(90deg, #F7B2D9 0%, #7EC6E3 100%)',
          }}
        />
      </div>
      {/* Upgrades Button */}
      <Link
        href="#"
        className="mt-1 flex items-center justify-center gap-3 h-[36px] min-w-[100px] opacity-100 rounded border border-[#FFFFFF33] bg-[#FFFFFF14] pt-2 pb-2 text-sm font-medium text-[#fff]"
      >
        Upgrades
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l14 0" />
          <path d="M15 16l4 -4" />
          <path d="M15 8l4 4" />
        </svg>
      </Link>
    </div>
  );
}
