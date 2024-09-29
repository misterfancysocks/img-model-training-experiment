import OrderCreation from '@/components/order-creation'

interface OrderCreationPageProps {
  params: { id: string }
}

export default function OrderCreationPage({ params }: OrderCreationPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 to-black text-orange-50 py-12">
      <main className="container mx-auto px-4">
        <OrderCreation orderId={params.id} />
      </main>
    </div>
  )
}