import { supabase } from './supabase';
import { sendEmailNotification } from './emailService';

export interface MemberBalance {
  mess_id: string;
  member_id: string;
  name: string;
  email: string;
  balance: number;
}

export const notifyIfCrossedToNegative = async (
  currentMessId: string,
  oldBalances: MemberBalance[],
  newBalances: MemberBalance[]
) => {
  if (!oldBalances || !newBalances) return;

  for (const newBal of newBalances) {
    const oldBal = oldBalances.find(b => b.member_id === newBal.member_id);
    
    // Check if they were >= 0 and are now < 0
    if (oldBal && oldBal.balance >= 0 && newBal.balance < 0) {
      const dueAmount = Math.abs(newBal.balance).toFixed(2);
      
      // 1. Send In-App Notification Only
      await supabase.from('notifications').insert({
        mess_id: currentMessId,
        user_id: newBal.member_id,
        title: 'Negative Balance Alert',
        message: `Your balance has dropped into the negative (Due: ৳${dueAmount}). Please make a deposit soon.`,
        type: 'alert'
      });
    }
  }
};
