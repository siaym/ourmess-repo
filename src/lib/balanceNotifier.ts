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
      
      // 1. Send In-App Notification
      await supabase.from('notifications').insert({
        mess_id: currentMessId,
        user_id: newBal.member_id,
        title: 'Negative Balance Alert',
        message: `Your balance has dropped into the negative (Due: ৳${dueAmount}). Please make a deposit soon.`,
        type: 'alert'
      });

      // 2. Send Email Notification
      if (newBal.email) {
        await sendEmailNotification({
          to_email: newBal.email,
          to_name: newBal.name || 'Member',
          subject: 'Action Required: Negative Balance Alert',
          message: `Hello ${newBal.name || 'Member'},\n\nThis is an automated alert from MessFlow.\n\nYour recent mess activity has caused your balance to drop into the negative. You currently owe ৳${dueAmount}.\n\nPlease make a deposit to the mess fund as soon as possible to keep everything balanced.\n\nThank you!`
        });
      }
    }
  }
};
