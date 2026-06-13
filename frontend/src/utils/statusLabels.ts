export function offerStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':   return 'Pending';
    case 'ACCEPTED':  return 'Accepted';
    case 'DECLINED':  return 'Declined';
    case 'WITHDRAWN': return 'Withdrawn';
    default:          return status;
  }
}

export function dealStatusLabel(
  status: string,
  viewerIsParticipantA: boolean
): string {
  switch (status) {
    case 'ACCEPTED':        return 'In progress';
    case 'COMPLETED_BY_A':  return viewerIsParticipantA ? 'Waiting on them' : 'Your turn to confirm';
    case 'COMPLETED_BY_B':  return viewerIsParticipantA ? 'Your turn to confirm' : 'Waiting on them';
    case 'COMPLETED':       return 'Complete ✓';
    case 'CANCELLED':       return 'Cancelled';
    default:                return status;
  }
}
