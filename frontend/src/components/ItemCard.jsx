import { Link } from 'react-router-dom';
import { imageSrc } from '../api';
import { formatDate } from '../utils';
import { StatusBadge, TypeBadge } from './Badges';

export default function ItemCard({ item }) {
  const src = imageSrc(item.imageUrl);
  return (
    <Link to={`/items/${item._id}`} className={`tag-card tag-${item.type}`}>
      <span className="tag-notch" aria-hidden="true" />
      <div className="tag-media">
        {src ? (
          <img src={src} alt="" loading="lazy" />
        ) : (
          <span className="tag-initial" aria-hidden="true">
            {item.category.charAt(0)}
          </span>
        )}
      </div>
      <div className="tag-body">
        <div className="tag-badges">
          <TypeBadge type={item.type} />
          <StatusBadge status={item.status} />
        </div>
        <h3>{item.title}</h3>
        <p className="tag-meta">{item.location}</p>
        <p className="tag-meta">{formatDate(item.dateOccurred)}</p>
      </div>
    </Link>
  );
}
