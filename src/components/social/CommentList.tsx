import { SocialComment } from '../../lib/comments'
import { Avatar } from './Avatar'

// Lista de comentarios cargados/elegibles, con contador. Muestra hasta `max`
// para no saturar el DOM, e indica cuántos quedan ocultos.
export function CommentList({
  comments,
  eligible,
  max = 60,
}: {
  comments: SocialComment[]
  /** Total elegible tras filtros (para el contador) */
  eligible: number
  max?: number
}) {
  const shown = comments.slice(0, max)
  const rest = comments.length - shown.length

  return (
    <div className="comment-block">
      <div className="comment-count">
        <strong>{eligible}</strong> participantes elegibles
        {comments.length !== eligible && <> · {comments.length} cargados</>}
      </div>
      <ul className="comment-list">
        {shown.map((c) => (
          <li className="comment-item" key={c.id}>
            <Avatar username={c.username} url={c.profilePicUrl} size={34} />
            <span className="comment-meta">
              <span className="comment-user">@{c.username}</span>
              <span className="comment-text">{c.text}</span>
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="comment-more">…y {rest} más</p>}
    </div>
  )
}
