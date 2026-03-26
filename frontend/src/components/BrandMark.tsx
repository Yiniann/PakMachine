type BrandMarkProps = {
  className?: string;
};

const BrandMark = ({ className = "h-5 w-5" }: BrandMarkProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 12.25 18.5 5.5l-2.9 12.75-4.1-4.1-3.6 3.25.8-4.95-3.95-.2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.3 14.2 4.3-4.15" />
    </svg>
  );
};

export default BrandMark;
