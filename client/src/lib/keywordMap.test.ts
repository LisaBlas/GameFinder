import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCategoryFallbackData, selectKeywordGraph } from './keywordMap';

test('category fallback fills both map rings without using the centre as a neighbour', () => {
  const keywords = Array.from({ length: 10 }, (_, index) => ({ id: index + 1, name: `Keyword ${index + 1}` }));
  const data = buildCategoryFallbackData(keywords);
  const graph = selectKeywordGraph(keywords[0], data[keywords[0].id], data, {}, { level1Count: 4, level2PerParent: 1 });

  assert.equal(graph.filter(node => node.level === 1).length, 4);
  assert.equal(graph.filter(node => node.level === 2).length, 4);
  assert.equal(new Set(graph.map(node => node.id)).size, graph.length);
  assert.ok(data[keywords[0].id].every(neighbor => neighbor.id !== keywords[0].id));
});
