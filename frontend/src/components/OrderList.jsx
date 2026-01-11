import OrderItem from './OrderItem';

function OrderList({ orders }) {
  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
}

export default OrderList;
