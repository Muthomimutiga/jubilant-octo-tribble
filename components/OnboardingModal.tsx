import React, { useState } from 'react';
import axios from 'axios';
import { X, Check } from 'lucide-react';
import PracticeAreaSelection from './PracticeAreaSelection';
import IntakeForm, { INTAKE_QUESTIONS } from './IntakeForm';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { useToast } from '../contexts/ToastContext';
import './Onboarding.css';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/sifybdml95iutivfxt8r3kdgdh32zpum';

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'selection' | 'form' | 'submitting' | 'error'>('selection');
    const [practiceArea, setPracticeArea] = useState<string>('');
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [error, setError] = useState<string>('');
    const { allUsers } = useAirtableData();
    const { addToast } = useToast();

    const handleClose = () => {
        setTimeout(() => {
            setStep('selection');
            setPracticeArea('');
            setFormData({});
            setError('');
        }, 300);
        onClose();
    };

    const handleSelectPracticeArea = (area: string) => {
        setPracticeArea(area);
        setStep('form');
    };

    const handleBack = () => {
        setStep('selection');
        setPracticeArea('');
        setFormData({});
    };

    const handleSubmit = async () => {
        // --- Form Validation ---
        const formConfig = INTAKE_QUESTIONS[practiceArea];
        if (!formConfig) {
            setError('Could not find form configuration. Please try again.');
            setStep('error');
            return;
        }

        const requiredFields = formConfig.sections
            .flatMap(section => section.fields)
            .filter(field => !field.label.toLowerCase().includes('(opt)'));

        for (const field of requiredFields) {
            const value = formData[field.id];
            if (value === undefined || value === null || String(value).trim() === '') {
                 const cleanLabel = field.label.replace(/\s*\(opt\)/i, '');
                addToast(`Please fill out the required field: "${cleanLabel}"`, 'error');
                return; // Stop submission
            }
        }
        
        setStep('submitting');
        setError('');
        
        const intakeDataWithMatterType = { ...formData };
        if (practiceArea === 'Children Cases') {
            intakeDataWithMatterType.matter_type = 'Child Custody and Maintenance';
        } else if (practiceArea === 'Adoption') {
            intakeDataWithMatterType.matter_type = 'Adoption';
        }

        const payload = {
            practiceArea,
            intakeData: intakeDataWithMatterType,
            submittedAt: new Date().toISOString()
        };

        try {
            await axios.post(MAKE_WEBHOOK_URL, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            addToast('Client onboarded successfully!', 'success');
            handleClose();
        } catch (err: any) {
            const errorMessage = err.message || 'An unknown error occurred. Please try again.';
            setError(errorMessage);
            setStep('error');
            addToast(`Error: ${errorMessage}`, 'error');
            console.error("Webhook submission failed:", err);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="onboarding-modal-overlay" onClick={handleClose}>
            <div className="onboarding-modal-content" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} className="onboarding-modal-close-btn" aria-label="Close onboarding form">
                    <X className="w-6 h-6" />
                </button>

                {step === 'selection' && (
                    <>
                        <div className="onboarding-modal-header">
                            <h2 className="onboarding-modal-title">Onboard New Client</h2>
                            <p className="onboarding-modal-subtitle">Step 1: Select a Practice Area</p>
                        </div>
                        <PracticeAreaSelection onSelectPracticeArea={handleSelectPracticeArea} />
                    </>
                )}

                {step === 'form' && (
                    <>
                        <div className="onboarding-modal-header">
                            <h2 className="onboarding-modal-title">{practiceArea}</h2>
                            <p className="onboarding-modal-subtitle">Step 2: Complete The Intake Form</p>
                        </div>
                        <div className="onboarding-modal-body">
                           <IntakeForm
                                practiceArea={practiceArea}
                                formData={formData}
                                setFormData={setFormData}
                                allUsers={allUsers}
                            />
                        </div>
                        <div className="onboarding-modal-footer">
                            <button onClick={handleBack} className="onboarding-btn-secondary">Back</button>
                            <button onClick={handleSubmit} className="onboarding-btn-primary">Submit Intake Form</button>
                        </div>
                    </>
                )}

                {step === 'submitting' && (
                    <div className="onboarding-feedback-view">
                        <div className="spinner"></div>
                        <h3 className="onboarding-feedback-title">Submitting...</h3>
                        <p className="onboarding-feedback-text">Sending intake data securely.</p>
                    </div>
                )}

                {step === 'error' && (
                     <div className="onboarding-feedback-view">
                        <div className="feedback-icon error-icon">
                            <X className="w-10 h-10" />
                        </div>
                        <h3 className="onboarding-feedback-title">Submission Failed</h3>
                        <p className="onboarding-feedback-text text-red-600">{error}</p>
                        <div className="flex gap-4 mt-4">
                           <button onClick={() => setStep('form')} className="onboarding-btn-secondary">Back to Form</button>
                           <button onClick={handleSubmit} className="onboarding-btn-primary">Try Again</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingModal;
