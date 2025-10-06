import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        setIsAdmin(data?.is_admin || false);
      } catch (error: any) {
        // Silently handle missing table or profile
        if (error?.code === '42P01' || error?.message?.includes('relation') || error?.status === 406) {
          setIsAdmin(false);
        } else {
          console.warn('Admin check failed:', error?.message || 'Unknown error');
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}