import styles from "./Spinner.module.css";

export default function Spinner({
  size = "md", // "sm" | "md" | "lg"
  text = null,
  fullScreen = false,
  isButton = false,
  color = "default", // "default" | "orange"
}) {
  const colorStyle = color === "orange" ? { color: "var(--accent-orange, #f59e0b)" } : {};

  return (
    <div
      className={`${styles.loadingContainer} ${
        fullScreen
          ? styles.fullscreen
          : isButton || size === "sm"
          ? styles.buttonMode
          : styles.inline
      }`}
      style={colorStyle}
      role="status"
      aria-label="Cargando..."
    >
      <div className={`${styles.logoWrapper} ${styles[size]}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 192 188"
          fill="none"
          className={styles.logoSvg}
        >
          {/* RUEDA DENTADA EXTERIOR (Giro horario) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 95.5 93.5"
              to="360 95.5 93.5"
              dur="8s"
              repeatCount="indefinite"
            />
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="m96.053.025 14.1.3.8 3.5c2 8.2 4.3 15.1 5.3 15.9.501.5 3.9 2.1 7.5 3.5 12.699 5.3 11.2 5.2 19.2.6 3.999-2.3 8.299-4.3 9.399-4.3 1.501-.2 5.102 2.6 11.301 8.6 4.996 4.896 9.094 8.994 9.1 9.2 0 .2-2.3 4.1-5 8.8l-5.1 8.4 3.699 9.2c2.3 5.8 4.401 9.6 5.801 10.3.37.235 1.136.604 2.155 1.039 1.825.656 4.339 1.44 6.945 2.16 4.699 1.2 8.898 2.5 9.299 2.9 1.2 1.2 2 19.1 1 23.601-.899 3.799-1 4-7.299 5.599-10.567 2.725-12.682 3.406-15.462 9.243-.236.793-.494 1.403-.82 1.808-.347.8-.716 1.68-1.119 2.65l-3.8 9.2 5.1 8.399c2.799 4.598 5.099 8.797 5.101 9.2 0 1.3-18.394 18.394-19.8 18.401-.7 0-4.9-2.101-9.2-4.601l-8-4.599-9.701 3.9c-8.999 3.6-9.7 4-11.5 8-.999 2.3-2.299 6.5-2.799 9.3-.5 2.799-1.201 5.598-1.601 6.099-.3.6-6.5.801-14.7.701l-14.1-.3-.8-3.5c-2-8.2-4.3-15.1-5.3-15.901-.5-.5-3.9-2.1-7.5-3.5-12.699-5.3-11.2-5.199-19.2-.599-3.999 2.299-8.3 4.299-9.4 4.3-1.5.199-5.1-2.601-11.3-8.6-4.998-4.898-9.096-8.998-9.1-9.2.003-.204 2.302-4.103 5-8.8l5.1-8.4-3.7-9.201c-2.3-5.799-4.4-9.599-5.8-10.299-.193-.124-.481-.31-.845-.542-1.791-.73-4.949-1.744-8.254-2.659-4.7-1.2-8.9-2.5-9.3-2.9-1.2-1.201-2-19.1-1-23.6.9-3.8 1-4 7.3-5.6C18.32 75 20.434 74.32 23.215 68.48c.236-.793.493-1.403.819-1.808.347-.8.716-1.678 1.12-2.647l3.799-9.2-5.1-8.4c-2.8-4.599-5.1-8.797-5.1-9.2.003-1.302 18.399-18.399 19.8-18.4.701.001 4.9 2.1 9.2 4.6l8 4.6 9.7-3.9c8.999-3.6 9.7-4 11.5-8 1-2.3 2.3-6.5 2.8-9.3.5-2.799 1.2-5.598 1.6-6.1.302-.599 6.502-.8 14.7-.7 M95.5 51C72.028 51 53 70.028 53 93.5S72.028 136 95.5 136 138 116.972 138 93.5 118.972 51 95.5 51z"
            />
          </g>

          {/* ANILLO INTERIOR */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 95.5 93.5"
              to="-360 95.5 93.5"
              dur="0.9s"
              repeatCount="indefinite"
            />

            <defs>
              <linearGradient
                id="arc1"
                x1="95.5"
                y1="71.5"
                x2="117.5"
                y2="93.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.66" />
              </linearGradient>

              <linearGradient
                id="arc2"
                x1="117.5"
                y1="93.5"
                x2="95.5"
                y2="115.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.66" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.33" />
              </linearGradient>

              <linearGradient
                id="arc3"
                x1="95.5"
                y1="115.5"
                x2="73.5"
                y2="93.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.33" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path
              d="M 95.5 71.5 A 22 22 0 0 1 117.5 93.5"
              stroke="url(#arc1)"
              strokeWidth="5.5"
              fill="none"
            />
            <path
              d="M 117.5 93.5 A 22 22 0 0 1 95.5 115.5"
              stroke="url(#arc2)"
              strokeWidth="5.5"
              fill="none"
            />
            <path
              d="M 95.5 115.5 A 22 22 0 0 1 73.5 93.5"
              stroke="url(#arc3)"
              strokeWidth="5.5"
              fill="none"
            />

            <circle cx="95.5" cy="71.5" r="2.75" fill="currentColor" />
          </g>
        </svg>
      </div>

      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
}