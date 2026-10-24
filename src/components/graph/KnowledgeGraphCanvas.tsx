import React, { useEffect, useRef, useState } from 'react';
import { GraphNode, GraphEdge, KnowledgeGraphData, ConversationSegment } from '../../types/avatar';
import { knowledgeGraphStore } from '../../services/knowledgeGraphStore';
import { Search, ZoomIn, ZoomOut, RotateCcw, Brain, History, Sparkles, X } from 'lucide-react';

interface Props {
  segments: ConversationSegment[];
  onSelectSegment?: (segment: ConversationSegment) => void;
}

export const KnowledgeGraphCanvas: React.FC<Props> = ({ segments, onSelectSegment }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData>(() => knowledgeGraphStore.getGraph());
  const [activeTab, setActiveTab] = useState<'graph' | 'segments'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const isDraggingNode = useRef<GraphNode | null>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Sync graph state from store
  useEffect(() => {
    const unsubscribe = knowledgeGraphStore.subscribe(() => {
      setGraphData({ ...knowledgeGraphStore.getGraph() });
    });
    return unsubscribe;
  }, []);

  // Force-Directed Layout Physics Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'graph') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const nodes = graphData.nodes;
    const edges = graphData.edges;

    // Initialize node positions if not set
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    nodes.forEach((n, idx) => {
      if (n.x === undefined || n.y === undefined) {
        const angle = (idx / nodes.length) * Math.PI * 2;
        const radius = 90 + Math.random() * 110;
        n.x = cx + Math.cos(angle) * radius;
        n.y = cy + Math.sin(angle) * radius;
        n.vx = 0;
        n.vy = 0;
      }
    });

    const stepPhysics = () => {
      // 1. Repulsion between all node pairs (Coulomb's Law)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = (n2.x || 0) - (n1.x || 0);
          const dy = (n2.y || 0) - (n1.y || 0);
          const distSq = dx * dx + dy * dy + 100;
          const dist = Math.sqrt(distSq);

          const force = 1800 / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (isDraggingNode.current !== n1) {
            n1.vx = (n1.vx || 0) - fx;
            n1.vy = (n1.vy || 0) - fy;
          }
          if (isDraggingNode.current !== n2) {
            n2.vx = (n2.vx || 0) + fx;
            n2.vy = (n2.vy || 0) + fy;
          }
        }
      }

      // 2. Spring attraction along edges (Hooke's Law)
      const targetDist = 120;
      const k = 0.04;
      for (const e of edges) {
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        if (!sourceNode || !targetNode) continue;

        const dx = (targetNode.x || 0) - (sourceNode.x || 0);
        const dy = (targetNode.y || 0) - (sourceNode.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const delta = dist - targetDist;

        const fx = (dx / dist) * delta * k;
        const fy = (dy / dist) * delta * k;

        if (isDraggingNode.current !== sourceNode) {
          sourceNode.vx = (sourceNode.vx || 0) + fx;
          sourceNode.vy = (sourceNode.vy || 0) + fy;
        }
        if (isDraggingNode.current !== targetNode) {
          targetNode.vx = (targetNode.vx || 0) - fx;
          targetNode.vy = (targetNode.vy || 0) - fy;
        }
      }

      // 3. Center gravity & velocity dampening
      for (const n of nodes) {
        if (isDraggingNode.current === n) continue;
        const cdx = cx - (n.x || cx);
        const cdy = cy - (n.y || cy);
        n.vx = ((n.vx || 0) + cdx * 0.005) * 0.88;
        n.vy = ((n.vy || 0) + cdy * 0.005) * 0.88;

        n.x = (n.x || 0) + n.vx;
        n.y = (n.y || 0) + n.vy;
      }

      // Render Graph to Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw Edges
      for (const e of edges) {
        const source = nodes.find(n => n.id === e.source);
        const target = nodes.find(n => n.id === e.target);
        if (!source || !target || source.x === undefined || target.x === undefined) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y!);
        ctx.lineTo(target.x, target.y!);

        const isHighlighted = source.isRecalled || target.isRecalled;
        ctx.strokeStyle = isHighlighted ? 'rgba(234, 179, 8, 0.75)' : 'rgba(51, 65, 85, 0.6)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
        ctx.stroke();

        // Edge relation label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y! + target.y!) / 2;
        ctx.fillStyle = isHighlighted ? '#FDE047' : '#94A3B8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.relation, midX, midY - 4);
      }

      // Draw Nodes
      const pulseTime = performance.now() * 0.005;
      for (const n of nodes) {
        if (n.x === undefined || n.y === undefined) continue;

        const isRecalled = n.isRecalled;
        const isMatch = searchQuery && n.label.toLowerCase().includes(searchQuery.toLowerCase());
        const isSelected = selectedNode?.id === n.id;

        // Golden memory pulse aura for recalled nodes
        if (isRecalled) {
          const pulseRadius = 24 + Math.sin(pulseTime) * 6;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Main Node Circle
        ctx.beginPath();
        const nodeRadius = 14 + Math.min(10, (n.mentionCount || 1) * 1.5);
        ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = n.color || '#3B82F6';
        ctx.fill();

        if (isSelected || isMatch) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Node Label
        ctx.fillStyle = '#F8FAFC';
        ctx.font = isSelected || isRecalled ? 'bold 12px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + nodeRadius + 14);

        // Node type badge
        ctx.fillStyle = '#94A3B8';
        ctx.font = '9px monospace';
        ctx.fillText(n.type.replace('_', ' '), n.x, n.y + nodeRadius + 26);
      }

      ctx.restore();
      animId = requestAnimationFrame(stepPhysics);
    };

    animId = requestAnimationFrame(stepPhysics);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [graphData, activeTab, zoom, pan, selectedNode, searchQuery]);

  // Pointer interactions for dragging nodes and panning canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked a node
    const clickedNode = graphData.nodes.find(n => {
      if (n.x === undefined || n.y === undefined) return false;
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return dx * dx + dy * dy < 400;
    });

    if (clickedNode) {
      isDraggingNode.current = clickedNode;
      setSelectedNode(clickedNode);
    } else {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDraggingNode.current) {
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      isDraggingNode.current.x = mouseX;
      isDraggingNode.current.y = mouseY;
    } else if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handleMouseUp = () => {
    isDraggingNode.current = null;
    isPanning.current = false;
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1219] border-l border-[#232B3E] text-slate-200 select-none">
      {/* Header with Navigation Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#232B3E] bg-[#141824]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-100">
            Memory & Knowledge Graph
          </span>
        </div>

        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0A0C10] rounded-lg border border-[#232B3E]">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'graph'
                ? 'bg-[#1E2538] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Graph ({graphData.nodes.length})
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'segments'
                ? 'bg-[#1E2538] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Segments ({segments.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'graph' ? (
        <div className="relative flex-1 w-full h-full min-h-[340px] overflow-hidden">
          {/* Search & Zoom Toolbar */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="relative pointer-events-auto flex-1 max-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs bg-[#131722]/90 border border-[#232B3E] rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/70"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#131722]/90 border border-[#232B3E] rounded-lg pointer-events-auto shadow-md">
              <button
                onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
                title="Zoom in"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
                title="Zoom out"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                title="Reset view"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={580}
            height={520}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full cursor-crosshair bg-[#0B0D13]"
          />

          {/* Selected Node Details Card */}
          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 p-3 bg-[#131722]/95 border border-[#232B3E] rounded-xl shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedNode.color || '#3B82F6' }}
                    />
                    {selectedNode.label}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                    <span>Type: {selectedNode.type}</span>
                    <span>·</span>
                    <span>Mentions: {selectedNode.mentionCount}</span>
                    {selectedNode.isRecalled && (
                      <span className="text-amber-400 font-semibold">Active in Memory</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Conversation Segments History List */
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
              <History className="w-8 h-8 mb-2 opacity-50" />
              <span>No conversation segments recorded yet.</span>
              <span className="text-[11px] mt-1 text-slate-600">
                Start chatting to build the context-aware memory graph!
              </span>
            </div>
          ) : (
            segments.map((seg, idx) => (
              <div
                key={seg.id}
                onClick={() => onSelectSegment?.(seg)}
                className="p-3 bg-[#131722] hover:bg-[#1A2030] border border-[#232B3E] rounded-xl cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Segment #{segments.length - idx}</span>
                  <span className="text-amber-400 font-semibold capitalize">
                    {seg.tone.dominant}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-200 leading-relaxed font-medium">
                  {seg.summary}
                </p>

                {/* Keywords as clean unboxed typography with bullet separators */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-slate-400 font-mono">
                  <Sparkles className="w-3 h-3 text-amber-400/80" />
                  {seg.keywords.map((kw, kIdx) => (
                    <React.Fragment key={kw}>
                      <span className="text-slate-300">#{kw}</span>
                      {kIdx < seg.keywords.length - 1 && <span className="text-slate-600">·</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
