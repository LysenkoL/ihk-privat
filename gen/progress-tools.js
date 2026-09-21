/* Reine Berechnungen für Fortschritt und Themenstatistik. */
"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IHKProgressTools = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function percent(value, max) {
    return max > 0 ? Math.round(value / max * 100) : 0;
  }

  function summary(points, gradedMax, allMax, gradedCount, allCount) {
    return {
      points,
      allMax,
      gradedCount,
      allCount,
      gradedRate: percent(points, gradedMax),
      examRate: percent(points, allMax),
      complete: allCount > 0 && gradedCount >= allCount
    };
  }

  function distributeByTopics(items, scores) {
    const result = {};
    (items || []).forEach(item => {
      const topics = item.topics && item.topics.length ? item.topics : ["sonstiges"];
      const divisor = topics.length;
      const maxShare = (Number(item.maxPoints) || 0) / divisor;
      const gotShare = (Number(scores && scores[item.k]) || 0) / divisor;
      topics.forEach(topic => {
        const entry = result[topic] || (result[topic] = { got: 0, max: 0 });
        entry.got += gotShare;
        entry.max += maxShare;
      });
    });
    return result;
  }

  return { summary, distributeByTopics };
});
