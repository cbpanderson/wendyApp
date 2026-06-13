import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getMyOffers } from '../api/offers';
import { getMyDeals } from '../api/deals';

export function useActionCount(): { count: number } {
  const { user } = useAuth();

  const { data: offersData } = useQuery({
    queryKey: ['me', 'offers', 'received', 'pending'],
    queryFn: () => getMyOffers('received', { status: 'PENDING', limit: 100 }),
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: dealsData } = useQuery({
    queryKey: ['me', 'deals', 'actionable'],
    queryFn: () => getMyDeals(),
    enabled: !!user,
    refetchInterval: 60000,
  });

  if (!user) return { count: 0 };

  const pendingOffersCount = offersData?.items.length ?? 0;

  const actionableDealsCount = (dealsData?.items ?? []).filter((deal) => {
    const isParticipantA = user.handle === deal.participantA.handle;
    const isParticipantB = user.handle === deal.participantB.handle;
    const status = deal.status;

    return (
      (isParticipantA || isParticipantB) &&
      status !== 'COMPLETED' &&
      status !== 'CANCELLED' &&
      !(isParticipantA && status === 'COMPLETED_BY_A') &&
      !(isParticipantB && status === 'COMPLETED_BY_B')
    );
  }).length;

  return { count: pendingOffersCount + actionableDealsCount };
}
