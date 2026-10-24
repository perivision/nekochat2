import {
  ConversationSegment,
  GraphNode,
  GraphEdge,
  KnowledgeGraphData,
  NodeType
} from '../types/avatar';

const STORAGE_KEY_SEGMENTS = 'felis_memory_segments_v1';
const STORAGE_KEY_GRAPH = 'felis_knowledge_graph_v1';

// Seed graph nodes to give the cat immediate lore and common human concepts
const INITIAL_NODES: GraphNode[] = [
  {
    id: 'node-cat-jiji',
    label: 'Jiji (Kiki\'s Familiar)',
    type: 'cat_lore',
    mentionCount: 14,
    lastRecalled: Date.now(),
    created: Date.now(),
    color: '#EAB308'
  },
  {
    id: 'node-kiki',
    label: 'Kiki\'s Delivery Flying Service',
    type: 'concept',
    mentionCount: 10,
    lastRecalled: Date.now(),
    created: Date.now(),
    color: '#3B82F6'
  },
  {
    id: 'node-cat-purr',
    label: 'Healing Purr Resonance',
    type: 'cat_lore',
    mentionCount: 8,
    lastRecalled: Date.now(),
    created: Date.now(),
    color: '#10B981'
  },
  {
    id: 'node-sunbeam',
    label: 'Warm Sunbeams & Rooftops',
    type: 'concept',
    mentionCount: 6,
    lastRecalled: Date.now(),
    created: Date.now(),
    color: '#F59E0B'
  },
  {
    id: 'node-curiosity',
    label: 'Feline Curiosity & Wit',
    type: 'concept',
    mentionCount: 7,
    lastRecalled: Date.now(),
    created: Date.now(),
    color: '#06B6D4'
  },
  {
    id: 'node-stress-relief',
    label: 'Grounding & Calmness',
    type: 'emotion',
    mentionCount: 4,
    lastRecalled: Date.now(),
    created: Date.now(),
    color: '#8B5CF6'
  }
];

const INITIAL_EDGES: GraphEdge[] = [
  {
    id: 'edge-1',
    source: 'node-cat-jiji',
    target: 'node-kiki',
    relation: 'guides & accompanies',
    weight: 0.95,
    lastRecalled: Date.now()
  },
  {
    id: 'edge-2',
    source: 'node-cat-jiji',
    target: 'node-cat-purr',
    relation: 'generates',
    weight: 0.9,
    lastRecalled: Date.now()
  },
  {
    id: 'edge-3',
    source: 'node-cat-purr',
    target: 'node-stress-relief',
    relation: 'soothes',
    weight: 0.85,
    lastRecalled: Date.now()
  },
  {
    id: 'edge-4',
    source: 'node-cat-jiji',
    target: 'node-sunbeam',
    relation: 'adores naps on',
    weight: 0.8,
    lastRecalled: Date.now()
  },
  {
    id: 'edge-5',
    source: 'node-cat-jiji',
    target: 'node-curiosity',
    relation: 'embodies',
    weight: 0.9,
    lastRecalled: Date.now()
  }
];

export class KnowledgeGraphStore {
  private segments: ConversationSegment[] = [];
  private graph: KnowledgeGraphData = {
    nodes: [...INITIAL_NODES],
    edges: [...INITIAL_EDGES]
  };
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      const savedSegments = localStorage.getItem(STORAGE_KEY_SEGMENTS);
      if (savedSegments) {
        this.segments = JSON.parse(savedSegments);
      }
      const savedGraph = localStorage.getItem(STORAGE_KEY_GRAPH);
      if (savedGraph) {
        const parsed = JSON.parse(savedGraph);
        if (parsed.nodes && parsed.edges && parsed.nodes.length > 0) {
          this.graph = parsed;
        }
      }
    } catch {
      // Fallback to initial seeds
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SEGMENTS, JSON.stringify(this.segments));
      localStorage.setItem(STORAGE_KEY_GRAPH, JSON.stringify(this.graph));
    } catch {}
  }

  public getSegments(): ConversationSegment[] {
    return this.segments;
  }

  public getGraph(): KnowledgeGraphData {
    return this.graph;
  }

  /**
   * Adds a new conversation segment and updates graph nodes/edges.
   */
  public addSegment(
    segment: Omit<ConversationSegment, 'id' | 'timestamp'> & {
      id?: string;
      timestamp?: number;
      triplets?: Array<{ subject: string; relation: string; object: string }>;
    }
  ): ConversationSegment {
    const id = segment.id || `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = segment.timestamp || Date.now();

    const createdNodeIds: string[] = [];

    // Process extracted keywords into knowledge graph nodes
    for (const keyword of segment.keywords) {
      const cleanKeyword = keyword.trim().toLowerCase();
      if (!cleanKeyword || cleanKeyword.length < 3) continue;

      const existingNode = this.graph.nodes.find(
        n => n.label.toLowerCase() === cleanKeyword
      );

      if (existingNode) {
        existingNode.mentionCount += 1;
        existingNode.lastRecalled = timestamp;
        createdNodeIds.push(existingNode.id);
      } else {
        const newNodeId = `node-${cleanKeyword.replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        const newNode: GraphNode = {
          id: newNodeId,
          label: keyword.trim(),
          type: this.inferNodeType(cleanKeyword, segment.tone.dominant),
          mentionCount: 1,
          lastRecalled: timestamp,
          created: timestamp,
          color: this.getNodeColorByType(this.inferNodeType(cleanKeyword, segment.tone.dominant))
        };
        this.graph.nodes.push(newNode);
        createdNodeIds.push(newNodeId);

        // Connect new node to Jiji cat or primary root
        const rootId = this.graph.nodes.find(n => n.id === 'node-cat-jiji')?.id || this.graph.nodes[0]?.id || 'node-cat-jiji';
        this.graph.edges.push({
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          source: rootId,
          target: newNodeId,
          relation: 'remembers',
          weight: 0.7,
          lastRecalled: timestamp
        });
      }
    }

    // Process explicit semantic triplets if returned by Gemini
    if (segment.triplets && Array.isArray(segment.triplets)) {
      for (const t of segment.triplets) {
        const sub = t.subject.trim();
        const obj = t.object.trim();
        const rel = t.relation.trim();
        if (!sub || !obj || !rel) continue;

        let subNode = this.graph.nodes.find(n => n.label.toLowerCase() === sub.toLowerCase());
        if (!subNode) {
          subNode = {
            id: `node-${sub.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
            label: sub,
            type: 'entity',
            mentionCount: 1,
            lastRecalled: timestamp,
            created: timestamp,
            color: '#3B82F6'
          };
          this.graph.nodes.push(subNode);
        }

        let objNode = this.graph.nodes.find(n => n.label.toLowerCase() === obj.toLowerCase());
        if (!objNode) {
          objNode = {
            id: `node-${obj.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
            label: obj,
            type: 'concept',
            mentionCount: 1,
            lastRecalled: timestamp,
            created: timestamp,
            color: '#10B981'
          };
          this.graph.nodes.push(objNode);
        }

        const existingEdge = this.graph.edges.find(
          e => (e.source === subNode!.id && e.target === objNode!.id) ||
               (e.source === objNode!.id && e.target === subNode!.id)
        );

        if (existingEdge) {
          existingEdge.weight = Math.min(1.0, existingEdge.weight + 0.1);
          existingEdge.lastRecalled = timestamp;
        } else {
          this.graph.edges.push({
            id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            source: subNode.id,
            target: objNode.id,
            relation: rel,
            weight: 0.75,
            lastRecalled: timestamp
          });
        }
      }
    }

    const newSegment: ConversationSegment = {
      id,
      timestamp,
      userText: segment.userText,
      avatarResponse: segment.avatarResponse,
      summary: segment.summary,
      keywords: segment.keywords,
      tone: segment.tone,
      recalledNodeIds: createdNodeIds,
      newGraphEntities: segment.keywords
    };

    this.segments.push(newSegment);
    this.notify();
    return newSegment;
  }

  /**
   * Context-Aware Memory Retrieval:
   * Finds relevant past segments and graph nodes based on the incoming user query.
   */
  public queryRelevantMemories(
    userText: string,
    limit = 4
  ): {
    relevantSegments: ConversationSegment[];
    relevantNodes: GraphNode[];
    contextString: string;
  } {
    const queryWords = userText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (queryWords.length === 0 || this.segments.length === 0) {
      return { relevantSegments: [], relevantNodes: [], contextString: '' };
    }

    // Score segments based on keyword overlap and semantic recency
    const scoredSegments = this.segments.map(seg => {
      let score = 0;
      const segText = `${seg.userText} ${seg.avatarResponse} ${seg.summary} ${seg.keywords.join(' ')}`.toLowerCase();

      for (const q of queryWords) {
        if (segText.includes(q)) {
          score += 2.0;
        }
      }

      for (const kw of seg.keywords) {
        if (queryWords.some(q => q.includes(kw.toLowerCase()) || kw.toLowerCase().includes(q))) {
          score += 3.0;
        }
      }

      // Small recency bonus (0.0 to 1.0)
      const hoursAgo = (Date.now() - seg.timestamp) / (1000 * 60 * 60);
      const recency = Math.max(0, 1.0 - hoursAgo / 24);
      score += recency * 0.5;

      return { segment: seg, score };
    });

    const relevantSegments = scoredSegments
      .filter(s => s.score > 2.0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.segment);

    // Identify corresponding graph nodes and mark them as temporarily recalled
    const recalledNodeIds = new Set<string>();
    for (const seg of relevantSegments) {
      for (const kw of seg.keywords) {
        const match = this.graph.nodes.find(n => n.label.toLowerCase() === kw.toLowerCase());
        if (match) {
          recalledNodeIds.add(match.id);
        }
      }
    }

    // Also match directly against graph nodes
    for (const node of this.graph.nodes) {
      const nodeLabel = node.label.toLowerCase();
      if (queryWords.some(q => nodeLabel.includes(q) || q.includes(nodeLabel))) {
        recalledNodeIds.add(node.id);
      }
    }

    // Set `isRecalled` flag on nodes for visual pulse in the graph
    for (const node of this.graph.nodes) {
      node.isRecalled = recalledNodeIds.has(node.id);
    }

    const relevantNodes = this.graph.nodes.filter(n => recalledNodeIds.has(n.id));

    // Construct human-readable context snippet for Gemini
    let contextString = '';
    if (relevantSegments.length > 0) {
      contextString = relevantSegments
        .map(
          (s, idx) =>
            `[Past Memory #${idx + 1}] Summary: ${s.summary} (Tone: ${s.tone.dominant}, Keywords: ${s.keywords.join(', ')})`
        )
        .join('\n');
    }

    return {
      relevantSegments,
      relevantNodes,
      contextString
    };
  }

  public clearRecalledHighlights() {
    let changed = false;
    for (const node of this.graph.nodes) {
      if (node.isRecalled) {
        node.isRecalled = false;
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  public resetMemory() {
    this.segments = [];
    this.graph = {
      nodes: [...INITIAL_NODES],
      edges: [...INITIAL_EDGES]
    };
    this.notify();
  }

  private inferNodeType(text: string, tone: string): NodeType {
    if (tone === 'empathetic' || ['stress', 'sad', 'happy', 'anxious', 'joy', 'calm'].some(e => text.includes(e))) {
      return 'emotion';
    }
    if (['like', 'love', 'prefer', 'favorite', 'hate', 'enjoy', 'coffee', 'tea', 'music'].some(p => text.includes(p))) {
      return 'user_preference';
    }
    if (['trip', 'work', 'project', 'meeting', 'birthday', 'vacation', 'today', 'yesterday'].some(ev => text.includes(ev))) {
      return 'event';
    }
    return 'concept';
  }

  private getNodeColorByType(type: NodeType): string {
    switch (type) {
      case 'user_preference':
        return '#EC4899'; // Pink
      case 'emotion':
        return '#8B5CF6'; // Purple
      case 'event':
        return '#F59E0B'; // Amber
      case 'entity':
        return '#3B82F6'; // Blue
      case 'cat_lore':
        return '#10B981'; // Emerald
      case 'concept':
      default:
        return '#06B6D4'; // Cyan
    }
  }
}

export const knowledgeGraphStore = new KnowledgeGraphStore();
