@@ .. @@
-import { useRouter } from 'next/navigation';
+import { useNavigate } from 'react-router-dom';
@@ .. @@
 export function DashboardCard({ title, value, trend, icon: Icon, color, isPrimary = false, target, onClick }: DashboardCardProps) {
-  const router = useRouter();
+  const navigate = useNavigate();
@@ .. @@
   const handleClick = () => {
     if (onClick) {
       onClick();
-      router.push('/activity');
+      navigate('/activity');
     }
   };