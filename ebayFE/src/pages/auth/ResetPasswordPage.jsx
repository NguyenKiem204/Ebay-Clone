import ResetPasswordForm from '../../features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
    return (
        <div className="w-full max-w-[440px] mx-auto px-4 py-10">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-normal text-gray-900 mb-2">
                    Create new password
                </h1>
                <p className="text-sm text-gray-500">
                    Please enter a new password for your account.
                </p>
            </div>

            <ResetPasswordForm />
        </div>
    );
}
