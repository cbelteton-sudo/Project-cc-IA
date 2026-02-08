
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    activityName: string;
}

export const BlockModal: React.FC<BlockModalProps> = ({ isOpen, onClose, onConfirm, activityName }) => {
    const [reason, setReason] = useState('');
    const [comment, setComment] = useState('');
    const [eta, setEta] = useState('');

    const handleSubmit = () => {
        onConfirm({ reason, comment, eta });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bloquear Actividad: {activityName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Razón del Bloqueo</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="" disabled>Selecciona una causa</option>
                            <option value="MATERIAL">Falta Material</option>
                            <option value="PLANO">Falta Plano / RFI</option>
                            <option value="MANO_DE_OBRA">Falta Mano de Obra</option>
                            <option value="CLIMA">Clima / Lluvia</option>
                            <option value="PAGO">Falta de Pago</option>
                            <option value="EQUIPO">Falla de Equipo</option>
                            <option value="COORDINACION">Mala Coordinación</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Comentarios</Label>
                        <Textarea
                            placeholder="Detalles adicionales..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Estimada de Desbloqueo (ETA)</Label>
                        <Input
                            type="date"
                            value={eta}
                            onChange={e => setEta(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={!reason}>Bloquear</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
