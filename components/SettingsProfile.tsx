
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const FormHeader: React.FC<{title:string; description:string}> = ({title, description}) => (
    <div className="pb-5 border-b border-slate-200">
        <h3 className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
);

const SettingsProfile: React.FC = () => {
    const { currentUser, updateUserPassword, reauthenticateUser, refetchCurrentUser } = useAuth();
    const { updateRecord, loading: mutationLoading } = useAirtableMutation();
    const { addToast } = useToast();
    
    const [name, setName] = useState(currentUser?.fields.Name || '');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || name === currentUser.fields.Name) return;

        try {
            await updateRecord('Users', currentUser.id, { Name: name });
            refetchCurrentUser();
            addToast('Name updated successfully!', 'success');
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            addToast(`Failed to update name: ${error.message}`, 'error');
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addToast("New passwords do not match.", 'error');
            return;
        }
        if (newPassword.length < 6) {
            addToast("Password must be at least 6 characters.", 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            await reauthenticateUser(currentPassword);
            await updateUserPassword(newPassword);
            addToast("Password updated successfully!", 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            addToast(error.message, 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!currentUser) {
        return <div>Loading user profile...</div>;
    }
    
    const avatarUrl = currentUser.fields.Avatar?.[0]?.url;
    const initials = currentUser.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';

    return (
        <div className="space-y-8">
            <div className="settings-card">
                 <form onSubmit={handleNameUpdate}>
                    <div className="p-6">
                        <div className="flex items-center gap-5 mb-6">
                             <div className="relative flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Your avatar" className="w-20 h-20 rounded-full object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-custom-indigo-100 text-custom-indigo-600 flex items-center justify-center font-bold text-3xl">
                                        {initials}
                                    </div>
                                )}
                                <span className="absolute bottom-1 right-1 block h-4 w-4 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-500" title="Online"></span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{name}</h2>
                                <p className="text-slate-500">{currentUser.fields.Email}</p>
                            </div>
                        </div>
                        <FormHeader title="Personal Information" description="Update your personal details here." />
                    </div>
                    <div className="px-6 pb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label htmlFor="name" className="form-label md:col-span-1">Name</label>
                            <div className="md:col-span-2">
                                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label htmlFor="email" className="form-label md:col-span-1">Email Address</label>
                            <div className="md:col-span-2">
                                <input type="email" id="email" value={currentUser.fields.Email} disabled className="form-input bg-slate-100 cursor-not-allowed" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label htmlFor="role" className="form-label md:col-span-1">Role</label>
                            <div className="md:col-span-2">
                                <input type="text" id="role" value={currentUser.fields.Role} disabled className="form-input bg-slate-100 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-slate-50 rounded-b-xl">
                        <button type="submit" className="btn-primary" disabled={mutationLoading || name === currentUser.fields.Name}>
                           {mutationLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                 </form>
            </div>
            
             <div className="settings-card">
                 <form onSubmit={handlePasswordUpdate}>
                    <div className="p-6">
                        <FormHeader title="Change Password" description="Update your password. Make sure it's a strong one." />
                    </div>
                    <div className="px-6 pb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label htmlFor="currentPassword" className="form-label md:col-span-1">Current Password</label>
                            <div className="md:col-span-2">
                                <input type="password" id="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="form-input" required autoComplete="current-password" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label htmlFor="newPassword" className="form-label md:col-span-1">New Password</label>
                            <div className="md:col-span-2">
                                <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" required autoComplete="new-password"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label htmlFor="confirmPassword" className="form-label md:col-span-1">Confirm New Password</label>
                            <div className="md:col-span-2">
                                <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="form-input" required autoComplete="new-password"/>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end p-4 bg-slate-50 rounded-b-xl">
                        <button type="submit" className="btn-primary" disabled={passwordLoading}>
                            {passwordLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                        </button>
                    </div>
                 </form>
             </div>
        </div>
    );
};

export default SettingsProfile;