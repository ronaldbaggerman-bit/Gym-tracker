import { COLORS } from '@/app/styles/colors';
import type { ProgressionDataPoint } from '@/utils/progressionData';
import { Dimensions, View } from 'react-native';
import Svg, {
    Circle,
    G,
    Line,
    Path,
    Rect,
    Text as SvgText,
} from 'react-native-svg';

interface ProgressLineChartProps {
  data: ProgressionDataPoint[];
  height?: number;
  width?: number;
  showTrendline?: boolean;
  showArea?: boolean;
}

export function ProgressLineChart({ 
  data, 
  height = 300, 
  width = Dimensions.get('window').width - 32,
  showTrendline = true,
  showArea = true,
}: ProgressLineChartProps) {
  if (data.length === 0) {
    return (
      <View style={{ height, width, justifyContent: 'center', alignItems: 'center' }}>
        <SvgText>Geen data beschikbaar</SvgText>
      </View>
    );
  }

  // Padding for the chart area
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max weight values
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  // Scale functions
  const scaleX = (index: number) => {
    return padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  };

  const scaleY = (weight: number) => {
    const normalized = (weight - minWeight) / weightRange;
    return padding.top + chartHeight - (normalized * chartHeight);
  };

  // Generate path for line
  const pathData = data
    .map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.weight);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Grid lines for Y axis (every 5kg or so)
  const gridStep = Math.max(1, Math.ceil(weightRange / 5));
  const gridLines = [];
  for (let w = Math.ceil(minWeight / gridStep) * gridStep; w <= maxWeight; w += gridStep) {
    const y = scaleY(w);
    gridLines.push(
      <Line
        key={`grid-${w}`}
        x1={padding.left}
        y1={y}
        x2={padding.left + chartWidth}
        y2={y}
        stroke={COLORS.SURFACE}
        strokeWidth="0.5"
        strokeDasharray="4,4"
      />
    );
  }

  return (
    <Svg width={width} height={height}>
      {/* Background */}
      <Rect 
        width={width} 
        height={height} 
        fill={COLORS.CARD}
      />

      {/* Grid lines */}
      {gridLines}

      {/* X axis */}
      <Line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke={COLORS.BORDER}
        strokeWidth="1"
      />

      {/* Y axis */}
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke={COLORS.BORDER}
        strokeWidth="1"
      />

      {/* Y axis labels */}
      <G>
        {Array.from({ length: 5 }).map((_, i) => {
          const weight = minWeight + (weightRange / 4) * i;
          const y = scaleY(weight);
          return (
            <SvgText
              key={`y-label-${i}`}
              x={padding.left - 10}
              y={y + 4}
              fontSize="10"
              fill={COLORS.TEXT_SECONDARY}
              textAnchor="end"
            >
              {Math.round(weight)}
            </SvgText>
          );
        })}
      </G>

      {/* X axis labels (every nth date) */}
      <G>
        {data.map((point, index) => {
          // Show every nth label to avoid crowding
          const step = Math.max(1, Math.floor(data.length / 5));
          if (index % step !== 0 && index !== data.length - 1) return null;

          const x = scaleX(index);
          const dateStr = point.date.split('-').slice(1).join('/'); // MM/DD format
          return (
            <SvgText
              key={`x-label-${index}`}
              x={x}
              y={padding.top + chartHeight + 20}
              fontSize="10"
              fill={COLORS.TEXT_SECONDARY}
              textAnchor="middle"
            >
              {dateStr}
            </SvgText>
          );
        })}
      </G>

      {/* Area under line */}
      {showArea && (
        <Path
          d={`${pathData} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
          fill="rgba(0, 191, 166, 0.08)"
        />
      )}

      {/* Line */}
      <Path
        d={pathData}
        stroke={COLORS.ACCENT}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trendline (linear regression) */}
      {showTrendline && data.length > 1 && (() => {
        const n = data.length;
        const sumX = data.reduce((acc, _, i) => acc + i, 0);
        const sumY = data.reduce((acc, point) => acc + point.weight, 0);
        const sumXY = data.reduce((acc, point, i) => acc + i * point.weight, 0);
        const sumX2 = data.reduce((acc, _, i) => acc + i * i, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
        const intercept = (sumY - slope * sumX) / n;

        const yStart = scaleY(intercept);
        const yEnd = scaleY(slope * (n - 1) + intercept);

        return (
          <Line
            x1={padding.left}
            y1={yStart}
            x2={padding.left + chartWidth}
            y2={yEnd}
            stroke={COLORS.TEXT_SECONDARY}
            strokeDasharray="6,4"
            strokeWidth="1.5"
          />
        );
      })()}

      {/* Data points (circles) */}
      {data.map((point, index) => {
        const x = scaleX(index);
        const y = scaleY(point.weight);
        const isLatest = index === data.length - 1;
        const isMax = point.weight === maxWeight;
        return (
          <G key={`point-${index}`}>
            <Circle
              cx={x}
              cy={y}
              r={isLatest ? 6 : 4}
              fill={isLatest ? '#FFD166' : COLORS.ACCENT}
              stroke={isMax ? '#FF3B30' : 'transparent'}
              strokeWidth={isMax ? 2 : 0}
            />
            {isLatest && (
              <SvgText
                x={x}
                y={y - 10}
                fontSize="10"
                fill={COLORS.TEXT_PRIMARY}
                textAnchor="middle"
              >
                {`${point.weight} kg`}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}
