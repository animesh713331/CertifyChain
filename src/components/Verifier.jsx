import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Download, Linkedin, Share2, ExternalLink } from 'lucide-react';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Verifier = ({ contract }) => {
    const [searchId, setSearchId] = useState('');
    const [result, setResult] = useState(null); // { status: 'idle' | 'loading' | 'valid' | 'invalid', data: ... }
    const certRef = useRef(null);

    // Auto-search from URL
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const id = query.get('id');
        if (id) setSearchId(id);
    }, []);

    const resolveIPFS = (uri) => {
        if (!uri) return "";
        if (uri.startsWith("ipfs://")) {
            return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        }
        return uri;
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        if (!searchId) return;
        if (!contract) return alert("Connect wallet first!");

        setResult({ status: 'loading' });
        try {
            // New signature: studentName, course, issueDate, issuerName, metadataUri, isValid, owner
            const data = await contract.getCertificate(searchId);

            if (data[5] === true) {
                let imageUri = null;
                const metadataUri = data[4];

                try {
                    // Scenario 1: Data URI (Base64)
                    if (metadataUri.startsWith("data:application/json;base64,")) {
                        const json = JSON.parse(atob(metadataUri.split(",")[1]));
                        imageUri = json.image;
                    }
                    // Scenario 2: IPFS URI
                    else if (metadataUri.startsWith("ipfs://")) {
                        const url = resolveIPFS(metadataUri);
                        const res = await fetch(url);
                        const json = await res.json();
                        imageUri = resolveIPFS(json.image);
                    }
                } catch (err) {
                    console.error("Metadata parse error", err);
                }

                setResult({
                    status: 'valid',
                    data: {
                        name: data[0],
                        course: data[1],
                        date: data[2],
                        issuer: data[3],
                        uri: metadataUri,
                        image: imageUri,
                        owner: data[6],
                        id: searchId
                    }
                });
            } else {
                setResult({ status: 'invalid', message: "Certificate has been REVOKED." });
            }
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes("Certificate not found")) {
                setResult({ status: 'invalid', message: "Certificate ID not found on chain." });
            } else {
                setResult({ status: 'error', message: "Verification failed. Ensure you are on the correct network." });
            }
        }
    };

    const handleDownloadPDF = async () => {
        if (!certRef.current) return;

        try {
            const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#1a1a2e", useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`Certificate-${result.data.id}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF. Note: CORS issues may persist with IPFS gateways during development.");
        }
    };

    const handleLinkedIn = () => {
        if (!result) return;
        const { name, course, date, id } = result.data;

        const year = date.split('-')[0];
        const month = date.split('-')[1];

        const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(course)}&organizationName=Codec%20Operations&issueYear=${year}&issueMonth=${month}&certId=${id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleVerify} className="relative mb-16 group max-w-xl mx-auto shadow-2xl">
                <input
                    type="text"
                    placeholder="Enter Certificate ID to verify..."
                    className="w-full bg-surface/80 backdrop-blur-md border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 text-white px-6 py-5 rounded-2xl text-lg outline-none transition-all pl-14 shadow-inner"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                >
                    Verify
                </button>
            </form>

            {result && result.status === 'loading' && (
                <div className="max-w-xl mx-auto text-center py-10 animate-pulse text-primary font-medium tracking-wide">
                    <div className="relative w-full h-64 bg-surfaceHighlight/30 rounded-2xl overflow-hidden mb-6 border border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent w-full h-full animate-scan" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Search className="w-12 h-12 text-primary/40 animate-pulse" />
                        </div>
                    </div>
                    Scanning Blockchain Records...
                </div>
            )}

            {result && result.status === 'invalid' && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-error/5 border border-error/20 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-[0_0_30px_rgba(244,63,94,0.1)] relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error/50 to-transparent" />
                    <XCircle className="w-16 h-16 text-error mx-auto mb-4" />
                    <h3 className="text-error text-2xl font-bold mb-2 tracking-tight">Verification Failed</h3>
                    <p className="text-gray-400 font-medium">{result.message}</p>
                </motion.div>
            )}

            {result && result.status === 'valid' && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Main Certificate Display */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card p-1 overflow-hidden shadow-2xl relative group animated-border">
                            <div ref={certRef} className="aspect-[4/3] bg-black/40 flex items-center justify-center relative p-2 z-10 rounded-xl overflow-hidden">
                                {result.data.image ? (
                                    <img
                                        src={result.data.image}
                                        alt="Certificate"
                                        className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.01]"
                                        crossOrigin="anonymous" // Important for html2canvas
                                    />
                                ) : (
                                    <div className="text-gray-500 font-medium">No Image Data Available</div>
                                )}

                                {/* Watermark/Overlay */}
                                <div className="absolute top-6 right-6 bg-success/10 text-success px-4 py-2 rounded-full text-xs font-bold border border-success/30 flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <CheckCircle className="w-4 h-4" /> VERIFIED ON-CHAIN
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleDownloadPDF} className="flex-1 btn-secondary flex items-center justify-center gap-2 py-4">
                                <Download className="w-5 h-5" /> Download PDF
                            </button>
                            <button onClick={handleLinkedIn} className="flex-1 btn-primary bg-[#0a66c2] from-[#0a66c2] to-[#004182] hover:from-[#08529e] hover:to-[#002f5e] border-none flex items-center justify-center gap-2 py-4 shadow-[0_0_20px_rgba(10,102,194,0.3)] hover:shadow-[0_0_25px_rgba(10,102,194,0.5)]">
                                <Linkedin className="w-5 h-5" /> Add to Profile
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Details */}
                    <div className="space-y-6">
                        {/* QR Code */}
                        <div className="glass-card p-8 text-center group">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 opacity-70">Verification Link</h3>
                            <div className="bg-white p-5 rounded-2xl inline-block shadow-lg group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-500">
                                <QRCode value={`${window.location.origin}?id=${result.data.id}`} size={160} />
                            </div>
                            <div className="mt-6 bg-black/40 px-3 py-2 rounded-lg inline-block border border-white/5 text-gray-400 text-xs font-mono tracking-wider">
                                ID: <span className="text-primary/90 font-bold">{result.data.id}</span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="glass-card p-8 space-y-6">
                            <div className="group">
                                <h4 className="text-primary text-xs uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1">Issue Date</h4>
                                <p className="text-gray-200 font-mono font-medium group-hover:text-white transition-colors">{result.data.date}</p>
                            </div>
                            <div className="group">
                                <h4 className="text-primary text-xs uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1">Recipient Address</h4>
                                <p className="text-gray-400 font-mono text-xs break-all group-hover:text-gray-300 transition-colors">{result.data.owner}</p>
                            </div>
                            <div className="pt-6 border-t border-white/5 group">
                                <h4 className="text-primary text-xs uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1">Authenticated Issuer</h4>
                                <p className="text-gray-200 font-medium group-hover:text-white transition-colors">{result.data.issuer}</p>
                            </div>
                        </div>
                    </div>

                </motion.div>
            )}
        </div>
    );
};

export default Verifier;
