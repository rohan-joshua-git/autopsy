import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically routes any visitor landing on http://localhost:3000/ 
  // straight into Reine's registration flow.
  redirect('/register');
}