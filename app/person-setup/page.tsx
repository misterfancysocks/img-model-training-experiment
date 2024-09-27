import PersonProfilePage from '@/components/person-setup';

export default function PersonSetupPage({ params }: { params: { id: string } }) {
  return <PersonProfilePage params={params} />;
}