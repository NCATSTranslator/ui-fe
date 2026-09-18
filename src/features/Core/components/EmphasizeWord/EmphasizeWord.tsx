import { FC, useId } from "react";
import Tooltip from "@/features/Core/components/Tooltip/Tooltip";

interface EmphasizeWordProps {
  objectName: string | boolean;
  subjectName: string | boolean;
  text: string;
  subjectPos: [number, number] | null;
  objectPos: [number, number] | null;
}

interface TextSegment {
  text: string;
  type: 'plain' | 'subject' | 'object';
  tooltipId?: string;
}

interface TooltipIds {
  subject: string;
  object: string;
}

const isValidPosition = (pos: [number, number] | null): pos is [number, number] =>
  pos !== null && pos.length === 2;

const splitTextIntoSegments = (
  text: string,
  subjectPos: [number, number] | null,
  objectPos: [number, number] | null,
  tooltipIds: TooltipIds,
): TextSegment[] => {
  if (!isValidPosition(subjectPos) || !isValidPosition(objectPos)) {
    return [{ text, type: 'plain' }];
  }

  type PositionEntry = { start: number; end: number; type: 'subject' | 'object' };
  const positions: PositionEntry[] = [];

  const addPosition = (pos: [number, number], type: 'subject' | 'object') => {
    const start = pos[0] - 1;
    const end = pos[1];
    if (start >= 0 && end <= text.length && start <= end) {
      positions.push({ start, end, type });
    } else {
      console.warn("Invalid range ignored:", pos);
    }
  };

  addPosition(subjectPos, 'subject');
  addPosition(objectPos, 'object');

  positions.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const pos of positions) {
    const effectiveStart = Math.max(pos.start, cursor);
    if (effectiveStart >= pos.end) continue;

    if (effectiveStart > cursor) {
      segments.push({ text: text.slice(cursor, effectiveStart), type: 'plain' });
    }
    segments.push({
      text: text.slice(effectiveStart, pos.end),
      type: pos.type,
      tooltipId: pos.type === 'subject' ? tooltipIds.subject : tooltipIds.object,
    });
    cursor = pos.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), type: 'plain' });
  }

  return segments;
};

const EmphasizeWord: FC<EmphasizeWordProps> = ({ text, subjectPos, objectPos, subjectName, objectName }) => {
  const instanceId = useId();
  const tooltipIds: TooltipIds = {
    subject: `${instanceId}-subject`,
    object: `${instanceId}-object`,
  };

  const segments = splitTextIntoSegments(text, subjectPos, objectPos, tooltipIds);
  const hasSubjectSegment = segments.some((segment) => segment.type === 'subject');
  const hasObjectSegment = segments.some((segment) => segment.type === 'object');

  return (
    <>
      {subjectName && hasSubjectSegment && (
        <Tooltip id={tooltipIds.subject}><span>Matched on: {subjectName}</span></Tooltip>
      )}
      {objectName && hasObjectSegment && (
        <Tooltip id={tooltipIds.object}><span>Matched on: {objectName}</span></Tooltip>
      )}
      <span>
        {segments.map((segment, i) =>
          segment.type === 'plain'
            ? <span key={i} className="inline">{segment.text}</span>
            : <strong key={segment.tooltipId} data-tooltip-id={segment.tooltipId} className="cursor-default">{segment.text}</strong>
        )}
      </span>
    </>
  );
};

export default EmphasizeWord;
