import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 12,
        color: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB', // Blue-600
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
        marginTop: 4
    },
    metaSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    column: {
        flexDirection: 'col',
        width: '45%'
    },
    label: {
        fontSize: 8,
        color: '#999',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    value: {
        fontSize: 10,
        marginBottom: 8
    },
    table: {
        width: '100%',
        marginTop: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6', // Gray-100
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    colDesc: { flex: 2 },
    colQty: { flex: 1, textAlign: 'center' },
    colPrice: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1, textAlign: 'right' },

    totalSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    totalBox: {
        width: '40%',
        padding: 10,
        backgroundColor: '#F9FAFB'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#aaa',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10
    }
});

interface POData {
    id: string;
    vendor: string;
    project: string;
    date: string;
    status: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    total: number;
    currency: string;
}

interface PurchaseOrderPDFProps {
    data: POData;
    labels: {
        title: string;
        project: string;
        vendor: string;
        date: string;
        desc: string;
        qty: string;
        price: string;
        total: string;
        status: string;
        approved: string;
        pending: string;
        footer: string;
    };
}

export const PurchaseOrderPDF = ({ data, labels }: PurchaseOrderPDFProps) => {
    // Format currency helper inside PDF context (Intl might not work perfectly in all PDF renderers, but standard formatter helps)
    const formatMoney = (amount: number) => {
        return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{labels.title}</Text>
                        <Text style={styles.subtitle}>PO #{data.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Constructora Demo</Text>
                        <Text style={styles.subtitle}>Av. Reforma 12-34, Zona 9</Text>
                        <Text style={styles.subtitle}>Guatemala City, 01009</Text>
                    </View>
                </View>

                {/* Meta Info */}
                <View style={styles.metaSection}>
                    <View style={styles.column}>
                        <Text style={styles.label}>{labels.vendor}</Text>
                        <Text style={styles.value}>{data.vendor}</Text>

                        <Text style={styles.label}>{labels.project}</Text>
                        <Text style={styles.value}>{data.project}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.label}>{labels.date}</Text>
                        <Text style={styles.value}>{data.date}</Text>

                        <Text style={styles.label}>{labels.status}</Text>
                        <Text style={{ ...styles.value, color: data.status === 'APPROVED' ? 'green' : 'orange' }}>
                            {data.status === 'APPROVED' ? labels.approved : labels.pending}
                        </Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={{ ...styles.label, ...styles.colDesc }}>{labels.desc}</Text>
                        <Text style={{ ...styles.label, ...styles.colQty }}>{labels.qty}</Text>
                        <Text style={{ ...styles.label, ...styles.colPrice }}>Price</Text>
                        <Text style={{ ...styles.label, ...styles.colTotal }}>{labels.total}</Text>
                    </View>
                    {data.items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={{ ...styles.value, ...styles.colDesc }}>{item.description}</Text>
                            <Text style={{ ...styles.value, ...styles.colQty }}>{item.quantity}</Text>
                            <Text style={{ ...styles.value, ...styles.colPrice }}>{formatMoney(item.unitPrice)}</Text>
                            <Text style={{ ...styles.value, ...styles.colTotal }}>{formatMoney(item.quantity * item.unitPrice)}</Text>
                        </View>
                    ))}
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{data.currency} {formatMoney(data.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>{labels.footer}</Text>
                    <Text style={{ marginTop: 5 }}>Generated by Antigravity System</Text>
                </View>
            </Page>
        </Document>
    );
};
