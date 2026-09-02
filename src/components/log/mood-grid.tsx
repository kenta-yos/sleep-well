/**
 * TDMS の二次元グラフ。横軸が快適度、縦軸が覚醒度。
 *
 * 快適度 = 活性度 + 安定度、覚醒度 = 活性度 − 安定度 なので、
 * 到達できる範囲は (活性度, 安定度) の正方形を45度回した菱形になる。
 * 枠を菱形で描いているのはそのため。四隅のラベルは原版の解釈に合わせた。
 */
const LIMIT = 20;

export function MoodGrid({
  pleasure,
  arousal,
  size = 200,
}: {
  pleasure: number;
  arousal: number;
  size?: number;
}) {
  const pad = 26;
  const inner = size - pad * 2;
  const center = size / 2;
  const unit = inner / 2 / LIMIT;

  const x = center + pleasure * unit;
  // SVG's y grows downward, so a positive arousal has to move up.
  const y = center - arousal * unit;

  return (
    <div className="flex justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`快適度 ${pleasure}、覚醒度 ${arousal}`}
      >
        {/* Reachable region: the (vitality, stability) square rotated 45°. */}
        <polygon
          points={[
            `${center},${pad}`,
            `${size - pad},${center}`,
            `${center},${size - pad}`,
            `${pad},${center}`,
          ].join(" ")}
          className="fill-surface stroke-border"
          strokeWidth={1}
        />

        <line
          x1={pad}
          y1={center}
          x2={size - pad}
          y2={center}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={center}
          y1={pad}
          x2={center}
          y2={size - pad}
          className="stroke-border"
          strokeWidth={1}
        />

        {/* Corner labels, following the original's reading of each quadrant. */}
        <text x={center} y={pad - 8} textAnchor="middle" className="fill-current text-[9px] opacity-50">
          興奮
        </text>
        <text x={center} y={size - pad + 16} textAnchor="middle" className="fill-current text-[9px] opacity-50">
          眠気
        </text>
        <text x={pad - 6} y={center + 3} textAnchor="end" className="fill-current text-[9px] opacity-50">
          不快
        </text>
        <text x={size - pad + 6} y={center + 3} textAnchor="start" className="fill-current text-[9px] opacity-50">
          快適
        </text>

        <circle cx={x} cy={y} r={6} className="fill-primary" />
        <circle cx={x} cy={y} r={11} className="fill-none stroke-primary" strokeWidth={1} opacity={0.4} />
      </svg>
    </div>
  );
}
