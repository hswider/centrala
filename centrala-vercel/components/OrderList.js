import OrderItem from './OrderItem';

export default function OrderList({ orders, shipments = {} }) {
  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} shipment={shipments[order.id]} />
      ))}
    </div>
  );
}
