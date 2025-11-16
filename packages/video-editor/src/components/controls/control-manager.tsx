import { useLivePlayerContext } from "@twick/live-player";
import PlayerControls from "./player-controls";
import { useTimelineContext } from "@twick/timeline";
import { usePlayerControl } from "../../hooks/use-player-control";
import useTimelineControl from "../../hooks/use-timeline-control";
import { TimelineZoomConfig } from "../video-editor";
import { useEffect, useState, useCallback } from "react";

const ControlManager = ({
  trackZoom,
  setTrackZoom,
  zoomConfig,
}: {
  trackZoom: number;
  setTrackZoom: (zoom: number) => void;
  zoomConfig: TimelineZoomConfig;
}) => {
  const [fitMode, setFitMode] = useState(false);
  const [fitZoom, setFitZoom] = useState<number | null>(null);
  const { currentTime, playerState } = useLivePlayerContext();
  const { togglePlayback } = usePlayerControl();
  const { canRedo, canUndo, totalDuration, selectedItem } = useTimelineContext();
  const { deleteItem, splitElement, handleUndo, handleRedo } = useTimelineControl();

  const computeFitZoom = useCallback(() => {
    if (!Number.isFinite(totalDuration) || totalDuration <= 0) return null;

    const scroll = document.querySelector(
      ".twick-timeline-scroll-container"
    ) as HTMLElement | null;
    const header = document.querySelector(
      ".twick-timeline-header-container"
    ) as HTMLElement | null;

    // Use the scroll container width but subtract the sticky track header.
    // The gutter is already inside the scrollable area for the seek row, so
    // we leave it in the available width to avoid under-fitting.
    const availableWidth = scroll ? scroll.clientWidth : 0;
    const headerWidth = header ? header.getBoundingClientRect().width : 0;

    const desiredWidth = Math.max(
      0,
      availableWidth - headerWidth
    );
    if (desiredWidth <= 0) return null;

    const basePxPerSecond = 100;
    const rawZoom = desiredWidth / (basePxPerSecond * totalDuration);
    const clamped = Math.min(zoomConfig.max, Math.max(zoomConfig.min, rawZoom));
    return clamped;
  }, [totalDuration, zoomConfig.max, zoomConfig.min]);

  useEffect(() => {
    if (!fitMode) return;
    const applyFit = () => {
      const z = computeFitZoom();
      if (z != null) {
        setFitZoom(z);
        setTrackZoom(z);
      }
    };
    applyFit();
    window.addEventListener("resize", applyFit);
    return () => window.removeEventListener("resize", applyFit);
  }, [fitMode, computeFitZoom, setTrackZoom]);

  const handleToggleFit = () => {
    const next = !fitMode;
    setFitMode(next);
    if (next) {
      const z = computeFitZoom();
      if (z != null) {
        setFitZoom(z);
        setTrackZoom(z);
      }
    } else {
      setFitZoom(null);
    }
  };

  return (
    <div className="twick-editor-timeline-controls">
      <PlayerControls
        selectedItem={selectedItem}
        duration={totalDuration}
        currentTime={currentTime}
        playerState={playerState}
        fitMode={fitMode}
        actualZoom={fitZoom ?? trackZoom}
        onToggleFit={handleToggleFit}
        togglePlayback={togglePlayback}
        canUndo={canUndo}
        canRedo={canRedo}
        onDelete={deleteItem}
        onSplit={splitElement}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoomLevel={trackZoom}
        setZoomLevel={setTrackZoom}
        zoomConfig={zoomConfig}
      />
    </div>
  );
};

export default ControlManager;
