import { redirect } from 'next/navigation';

export default function NewCodeRequestRoute() {
    redirect('/manage-codes/new');
}