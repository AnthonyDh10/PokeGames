import { colors } from "../design/colors";

interface DiagonalBackgroundProps {
  children: React.ReactNode;
  colorLeft?: string;
  colorStripe?: string;
  colorRight?: string;
  className?: string;
}

export default function DiagonalBackground({
  children,
  colorLeft = colors.ui.bgLeft,
  colorStripe = colors.ui.bgStripe,
  colorRight = colors.ui.bgRight,
  className = '',
}: DiagonalBackgroundProps) {
  const background = `linear-gradient(115deg, ${colorLeft} calc(50% - 3px), ${colorStripe} calc(50% - 80px), ${colorStripe} calc(50% + 80px), ${colorRight} calc(50% + 3px))`;

  return (
    <div
      className={`min-h-screen w-full flex flex-col ${className}`}
      style={{
        backgroundImage: `linear-gradient(115deg, ${colorLeft} calc(50% - 3px), ${colorStripe} calc(50% - 80px), ${colorStripe} calc(50% + 80px), ${colorRight} calc(50% + 3px))`,
        backgroundAttachment: 'fixed',
      }}
    >
      {children}
    </div>
  );
}
