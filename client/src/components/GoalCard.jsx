import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressRing from './ProgressRing';
import { StatusChip, ProgressChip, DaysChip } from './Chip';
import { api } from '../api';

// Goal cards on the Topics screen: ring instead of the old flat progress
// bar, plus a collapsible Notion-style outline preview (Topic -> a couple
// of its Tasks). The preview is fetched lazily on first expand (not eagerly
// for every card in the list) so browsing the Topics screen doesn't fire an
// N+1 burst of goal-detail requests up front.
export default function GoalCard({ goal, onUnarchive }) {
  const navigate = useNavigate();
  const id = goal._id || goal.id;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTopics, setPreviewTopics] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  function togglePreview(e) {
    e.stopPropagation();
    setPreviewOpen((wasOpen) => {
      const next = !wasOpen;
      if (next && previewTopics === null && !previewLoading) {
        setPreviewLoading(true);
        api
          .getGoal(id)
          .then((res) => setPreviewTopics(res.topics || []))
          .catch(() => setPreviewTopics([]))
          .finally(() => setPreviewLoading(false));
      }
      return next;
    });
  }

  const topics = previewTopics || [];
  const firstTopic = topics[0];
  const firstTopicTasks = firstTopic ? (firstTopic.subtopics || []).flatMap((st) => st.tasks || []) : [];

  return (
    <div className="goal-card">
      <div className="goal-card-top">
        <button type="button" className="goal-card-title" onClick={() => navigate(`/goals/${id}`)}>
          {goal.title}
        </button>
        <ProgressRing progress={goal.progress} status={goal.status} size={48} strokeWidth={5} />
      </div>
      <div className="chip-row">
        <ProgressChip progress={goal.progress} />
        <StatusChip status={goal.status} />
        <DaysChip daysRemaining={goal.daysRemaining} dailyTargetPct={goal.dailyTargetPct} />
      </div>

      <button type="button" className="outline-toggle" onClick={togglePreview}>
        <span className={`topic-chevron ${previewOpen ? 'open' : ''}`}>▶</span>
        Outline
      </button>

      {previewOpen && (
        <div className="outline-preview">
          {previewLoading && <p className="empty-state">Loading…</p>}
          {!previewLoading && topics.length === 0 && <p className="empty-state">No topics yet.</p>}
          {!previewLoading && firstTopic && (
            <div className="outline-topic">
              <div className="outline-topic-title">{firstTopic.title}</div>
              <ul className="outline-task-list">
                {firstTopicTasks.slice(0, 2).map((task) => (
                  <li key={task._id || task.id} className={`outline-task ${task.completed ? 'done' : ''}`}>
                    {task.title}
                  </li>
                ))}
                {firstTopicTasks.length === 0 && (
                  <li className="outline-task outline-task-empty">No tasks yet.</li>
                )}
              </ul>
            </div>
          )}
          {topics.length > 1 && (
            <div className="outline-more">
              +{topics.length - 1} more topic{topics.length - 1 === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}

      {onUnarchive && (
        <div className="goal-card-actions">
          <button type="button" className="btn btn-subtle btn-sm" onClick={() => onUnarchive(id)}>
            Unarchive
          </button>
        </div>
      )}
    </div>
  );
}
