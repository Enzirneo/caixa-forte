const LARGURA_DO_DESENHO = 131
const ALTURA_DO_DESENHO = 113

interface Props {
  size?: number
}

export function IconeCofre({ size = 24 }: Props): React.JSX.Element {
  const altura = size * (ALTURA_DO_DESENHO / LARGURA_DO_DESENHO)

  return (
    <svg
      width={size}
      height={altura}
      viewBox={`0 0 ${LARGURA_DO_DESENHO} ${ALTURA_DO_DESENHO}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="123" height="105" rx="12" />
      <circle cx="65.5" cy="56.5" r="36.5" />
      <path d="M22 40H33" />
      <path d="M22 74H33" />
      <path d="M65.5 45C72.5205 45 78 50.4877 78 57C78 63.5123 72.5205 69 65.5 69C58.4795 69 53 63.5123 53 57C53 50.4877 58.4795 45 65.5 45Z" />
    </svg>
  )
}
