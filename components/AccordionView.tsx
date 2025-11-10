
import React from 'react';
import { AirtableRecord, Document, Matter } from '../types';
import MatterAccordion from './MatterAccordion';

interface AccordionViewProps {
  groupedData: { matter: AirtableRecord<Matter>; documents: AirtableRecord<Document>[] }[];
  onPreviewDocument: (doc: AirtableRecord<Document>) => void;
  onEditDocument: (doc: AirtableRecord<Document>) => void;
  onDeleteDocument: (doc: AirtableRecord<Document>) => void;
  activeDocumentId: string | null;
}

const AccordionView: React.FC<AccordionViewProps> = ({
  groupedData,
  onPreviewDocument,
  onEditDocument,
  onDeleteDocument,
  activeDocumentId,
}) => {
  return (
    <div className="documents-list-container">
      {groupedData.map(({ matter, documents }) => (
        <MatterAccordion
          key={matter.id}
          matter={matter}
          documents={documents}
          onPreviewDocument={onPreviewDocument}
          onEditDocument={onEditDocument}
          onDeleteDocument={onDeleteDocument}
          activeDocumentId={activeDocumentId}
        />
      ))}
    </div>
  );
};

export default AccordionView;
