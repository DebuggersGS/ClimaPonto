import { AnimatedItem, AnimatedList } from '../ui/Reveal.jsx'
import StopStatusCard from './StopStatusCard.jsx'

/**
 * Grade de cartões por ponto: 1 coluna (mobile), 2 (md) e 3 (xl).
 * @param {{ items: Array<{ stop: object }>, now: Date|number }} props
 */
export default function StopGrid({ items, now }) {
  return (
    <AnimatedList as="ul" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <AnimatedItem as="li" key={item.stop.id} className="min-w-0">
          <StopStatusCard item={item} now={now} />
        </AnimatedItem>
      ))}
    </AnimatedList>
  )
}
