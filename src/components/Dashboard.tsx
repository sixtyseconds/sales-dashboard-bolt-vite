@@ .. @@
 import { useUser } from '@/lib/hooks/useUser';
 import { useSalesData } from '@/lib/hooks/useSalesData';
 import { useTargets } from '@/lib/hooks/useTargets';
-import { useRouter } from 'next/navigation';
+import { useNavigate } from 'react-router-dom';
 import { useActivities } from '@/lib/hooks/useActivities';
@@ .. @@
   const [searchQuery, setSearchQuery] = useState('');
   const { userData } = useUser();
-  const router = useRouter();
+  const navigate = useNavigate();
@@ .. @@
           <button
             className="hidden sm:block px-4 py-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
-            onClick={() => router.push('/activity')}
+            onClick={() => navigate('/activity')}
           >