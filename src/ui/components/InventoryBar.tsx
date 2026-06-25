import { useInventoryStore } from '@state/inventoryStore';

/**
 * The foundation inventory readout: a small row of chips for the items the
 * player is carrying. It reads the {@link useInventoryStore} projection only, so
 * it stays a pure view of simulation state. Hidden entirely while empty.
 */
export const InventoryBar = (): React.JSX.Element | null => {
  const items = useInventoryStore((state) => state.items);
  if (items.length === 0) return null;
  return (
    <div className="inventory" aria-label="Inventory">
      {items.map((item) => (
        <span key={item.id} className="inventory__item">
          {item.name}
        </span>
      ))}
    </div>
  );
};
