import React from 'react';
import { AirtableRecord, User } from '../types';
import UserAutocomplete from './UserAutocomplete';
import UserMultiSelect from './UserMultiSelect';

interface Field {
    id: string;
    label: string;
    type: 'text' | 'date' | 'textarea' | 'select';
    options?: string[];
    placeholder?: string;
}

interface Section {
    title: string;
    fields: Field[];
}

interface IntakeFormConfig {
    [key: string]: {
        sections: Section[];
    };
}

const GENERAL_MATTER_TYPES = [
    'Guardianship',
    'Succession',
    'Surrogacy',
    'Conveyancing',
    'Estate Planning',
    'Commercial',
    'General Dispute Resolution',
    'Litigation',
    'Caution',
    'Miscellaneous Application',
    'Appeal',
    'Mediation',
    'Constitutional Petition',
    'Mental Health',
    'Deed Poll',
    'Citizenship',
    'General File',
];

export const INTAKE_QUESTIONS: IntakeFormConfig = {
    'Matrimonial Matters': {
        sections: [
            {
                title: "Client's Bio-data",
                fields: [
                    { id: 'client_full_names', label: "Full Official Names", type: 'text' },
                    { id: 'file_number', label: "File Number", type: 'text', placeholder: 'e.g., KCO/MAT/001/24' },
                    {
                        id: 'matter_type',
                        label: 'Specific Matter Type',
                        type: 'select',
                        options: ['Divorce', 'Matrimonial Property Suits', 'Parental responsibility', 'Separation Agreement']
                    },
                    { id: 'brief_assistant', label: "Assign Attorney", type: 'select' },
                    { id: 'client_phone', label: "Phone Number", type: 'text' },
                    { id: 'client_postal_address', label: "Postal Address", type: 'text' },
                    { id: 'client_email', label: "Email Address", type: 'text' },
                    { id: 'client_id_number', label: "I.D Number", type: 'text' },
                    { id: 'client_residence', label: "Residence", type: 'text' },
                    { id: 'client_occupation', label: "Occupation and Employer", type: 'text' },
                ],
            },
            {
                title: "Other Party's Bio-data",
                fields: [
                    { id: 'other_party_full_names', label: "Full Official Names", type: 'text' },
                    { id: 'other_party_postal_address', label: "Postal Address", type: 'text' },
                    { id: 'other_party_physical_address', label: "Physical Address (Office or Home)", type: 'text' },
                    { id: 'other_party_phone', label: "Phone Number", type: 'text' },
                    { id: 'other_party_email', label: "Email Address", type: 'text' },
                    { id: 'other_party_occupation', label: "Occupation and Employer", type: 'text' },
                ],
            },
            {
                title: 'Case Details',
                fields: [
                    { id: 'marriage_nature', label: "Date and nature of the marriage (Religious, civil, or customary)?", type: 'text' },
                    { id: 'marriage_date_place', label: "Date and place of the marriage?", type: 'text' },
                    { id: 'marriage_residences', label: "Principal places of residence during the marriage?", type: 'textarea' },
                    { id: 'separation_status', label: "Are parties still living together or separated? If separated, since when?", type: 'text' },
                    { id: 'children_details', label: "Full names and dates of birth of children of the marriage?", type: 'textarea' },
                    { id: 'court_requests', label: "What do you seek from the Court?", type: 'select', options: ['Divorce', 'Separation', 'Matrimonial Property', 'Spousal Maintenance'] },
                    { id: 'previous_expenditure', label: "Previous monthly expenditure & other parent's contribution?", type: 'textarea' },
                    { id: 'current_expenditure', label: "Current monthly family expenditure? (Food, rent, school fees, etc.)", type: 'textarea' },
                    { id: 'property_details', label: "Details of Matrimonial Property (when/how acquired, contributions)?", type: 'textarea' },
                    { id: 'cruelty_instances', label: "Instances/events of cruelty by the other party?", type: 'textarea' },
                    { id: 'adultery_instances', label: "Instances/events of adultery by the other party?", type: 'textarea' },
                    { id: 'desertion_instances', label: "Instances/events of desertion by the other party?", type: 'textarea' },
                    { id: 'resolution_attempts', label: "Attempts taken to resolve disputes? (Counseling, mediation, etc.)", type: 'textarea' },
                    { id: 'breakdown_reasons', label: "Reasons why the marriage has irretrievably broken down?", type: 'textarea' },
                    { id: 'other_info', label: "Any other relevant information? (opt)", type: 'textarea' },
                ],
            },
        ],
    },
    'Children Cases': {
        sections: [
             {
                title: "Client's Bio-data",
                fields: [
                    { id: 'client_full_names', label: "Full Official Names", type: 'text' },
                    { id: 'file_number', label: "File Number", type: 'text', placeholder: 'e.g., KCO/CHD/001/24' },
                    { id: 'brief_assistant', label: "Assign Attorney", type: 'select' },
                    { id: 'client_phone', label: "Phone Number", type: 'text' },
                    { id: 'client_postal_address', label: "Postal Address", type: 'text' },
                    { id: 'client_email', label: "Email Address", type: 'text' },
                    { id: 'client_id_number', label: "I.D Number", type: 'text' },
                    { id: 'client_residence', label: "Residence", type: 'text' },
                    { id: 'client_occupation', label: "Occupation and Employer", type: 'text' },
                ],
            },
            {
                title: "Other Party's Bio-data",
                fields: [
                    { id: 'other_party_full_names', label: "Full Official Names", type: 'text' },
                    { id: 'other_party_postal_address', label: "Postal Address", type: 'text' },
                    { id: 'other_party_physical_address', label: "Physical Address (Office or Home)", type: 'text' },
                    { id: 'other_party_phone', label: "Phone Number", type: 'text' },
                    { id: 'other_party_email', label: "Email Address", type: 'text' },
                    { id: 'other_party_occupation', label: "Occupation and Employer", type: 'text' },
                ],
            },
            {
                title: "Child & Co-Parenting Details",
                fields: [
                    { id: 'children_names_dob', label: "Full names and dates of birth of the children? (Attach copies of birth certificates)", type: 'textarea' },
                    { id: 'children_born_together', label: "Were children born while living together?", type: 'text' },
                    { id: 'primary_caregiver', label: "Who has been the primary caregiver/provider?", type: 'text' },
                    { id: 'other_parent_participation', label: "What kind of participation has the other parent had in the child's life?", type: 'textarea' },
                    { id: 'child_living_status', label: "Is the child currently living with the other parent? If not, how/when did that change?", type: 'textarea' },
                    { id: 'neglect_periods', label: "Indicate periods when the other parent neglected to provide maintenance.", type: 'textarea' },
                    { id: 'salary_estimates', label: "Your salary and estimated salary of the other parent?", type: 'text' },
                    { id: 'previous_proceedings', label: "Any previous proceedings between you and the other parent?", type: 'textarea' },
                ],
            },
            {
                title: "Co-Parenting Terms (Preferred)",
                fields: [
                    { id: 'coparent_residence', label: "Where and with whom will the children live?", type: 'textarea' },
                    { id: 'coparent_parenting_time', label: "What parenting time should be reserved for the other parent?", type: 'textarea' },
                    { id: 'coparent_holidays', label: "How should school holidays be shared?", type: 'textarea' },
                    { id: 'coparent_birthdays', label: "How should birthdays & holidays (Christmas, etc.) be shared?", type: 'textarea' },
                    { id: 'coparent_grandparents', label: "How should grandparents be involved?", type: 'textarea' },
                    { id: 'coparent_housing', label: "Who should provide housing, food, and nanny costs?", type: 'textarea' },
                    { id: 'coparent_education', label: "Who should pay for education (including books, uniform, activities)?", type: 'textarea' },
                    { id: 'coparent_medical', label: "How will medical care and clothing be provided?", type: 'textarea' },
                    { id: 'coparent_travel', label: "Is travel/relocation abroad anticipated? How will this be handled?", type: 'textarea' },
                ]
            }
        ],
    },
    Adoption: {
        sections: [
            {
                title: "Applicant(s) Information",
                fields: [
                    { id: 'adopting_father_name', label: "Full official names of adopting father/mother", type: 'text' },
                    { id: 'file_number', label: "File Number", type: 'text', placeholder: 'e.g., KCO/ADP/001/24' },
                    { id: 'brief_assistant', label: "Assign Attorney", type: 'select' },
                    { id: 'adopting_address', label: "Post Office Box Number / Address", type: 'text' },
                    { id: 'adopting_phone', label: "Telephone & Mobile Numbers", type: 'text' },
                    { id: 'adopting_email', label: "Email Address", type: 'text' },
                ],
            },
            {
                title: "Application Details",
                fields: [
                    { id: 'child_current_name', label: "Child's current name", type: 'text' },
                    { id: 'child_proposed_name', label: "Child's proposed new name after adoption", type: 'text' },
                    { id: 'guardian_ad_litem', label: "Guardian ad litem's name, telephone, and email", type: 'text' },
                    { id: 'adoption_society', label: "Name of the Adoption Society dealing with the case", type: 'text' },
                    { id: 'adoption_further_details', label: "Any further details about the application (opt)", type: 'textarea' },
                ],
            },
        ],
    },
    'General Matter': {
        sections: [
            {
                title: "Client's Bio-data",
                fields: [
                    { id: 'client_full_names', label: "Full Official Names", type: 'text' },
                    { id: 'file_number', label: "File Number", type: 'text', placeholder: 'e.g., KCO/GEN/001/24' },
                    {
                        id: 'matter_type',
                        label: 'Specific Matter Type',
                        type: 'select',
                        options: GENERAL_MATTER_TYPES,
                    },
                    { id: 'brief_assistant', label: "Assign Attorney", type: 'select' },
                    { id: 'client_phone', label: "Phone Number", type: 'text' },
                    { id: 'client_postal_address', label: "Postal Address", type: 'text' },
                    { id: 'client_email', label: "Email Address", type: 'text' },
                    { id: 'client_id_number', label: "I.D No.", type: 'text' },
                    { id: 'client_pin', label: "PIN Number (For taxable Transactions) (opt)", type: 'text' },
                    { id: 'client_residence', label: "Residence", type: 'text' },
                    { id: 'client_occupation', label: "Occupation and Employer", type: 'text' },
                ],
            },
            {
                title: "Instruction Details",
                fields: [
                    { id: 'instruction_date', label: "Date of Instructions", type: 'date' },
                    { id: 'instruction_nature', label: "Nature of Instructions", type: 'textarea' },
                ],
            },
        ],
    },
};

interface IntakeFormProps {
    practiceArea: string;
    formData: Record<string, any>;
    setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    allUsers: AirtableRecord<User>[];
}

const IntakeForm: React.FC<IntakeFormProps> = ({ practiceArea, formData, setFormData, allUsers }) => {
    const formConfig = INTAKE_QUESTIONS[practiceArea];

    if (!formConfig) {
        return <p className="text-red-500">Error: No form configuration found for {practiceArea}.</p>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const renderField = (field: Field) => {
        const commonProps = {
            id: field.id,
            name: field.id,
            value: formData[field.id] || '',
            onChange: handleChange,
            className: "intake-form-input",
            placeholder: field.placeholder || ''
        };

        if (field.id === 'brief_assistant') {
             return (
                <UserMultiSelect
                    allUsers={allUsers}
                    selectedIds={formData.brief_assistant || []}
                    onSelectionChange={(ids) => setFormData(prev => ({ ...prev, brief_assistant: ids }))}
                    disabled={!allUsers || allUsers.length === 0}
                    placeholder="Search and assign attorneys..."
                />
            );
        }

        switch (field.type) {
            case 'textarea':
                return <textarea {...commonProps} rows={4} />;
            case 'select':
                return (
                    <select {...commonProps} className="intake-form-select">
                        <option value="">-- Please select --</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                );
            default:
                return <input type={field.type} {...commonProps} />;
        }
    };

    return (
        <form className="intake-form">
            {formConfig.sections.map(section => (
                <fieldset key={section.title} className="intake-form-section">
                    <legend className="intake-form-section-title">{section.title}</legend>
                    <div className="intake-form-grid">
                        {section.fields.map(field => {
                            const isRequired = !field.label.toLowerCase().includes('(opt)');
                            return (
                                <div key={field.id} className="intake-form-group">
                                    <label htmlFor={field.id} className="intake-form-label">
                                        {field.label.replace(/\s*\(opt\)/i, '')}
                                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {renderField(field)}
                                </div>
                            )
                        })}
                    </div>
                </fieldset>
            ))}
        </form>
    );
};

export default IntakeForm;
