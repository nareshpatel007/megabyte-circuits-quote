export default function Footer() {
    return (
        <footer className="bg-[#0f1729] text-gray-300 pt-16 pb-8 mt-12 border-t-4 border-primary">
            <div className="max-w-[1550px] mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">PCB Service</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">FR-4 PCBs</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Flexible PCBs</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Advanced PCBs</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">PCB Assembly</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">SMT Stencil</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Shipping Guide</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Payment Options</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Quality Assurance</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Factory Tour</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Certifications</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                        </ul>
                    </div>
                    <div className="lg:col-span-3 flex flex-col items-start lg:items-end">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/images/logo.png" alt="Megabyte Circuit Logo" className="h-24 w-auto object-contain brightness-0 invert" />
                        </div>
                        <p className="text-sm leading-relaxed mb-2 max-w-sm lg:text-right text-gray-400">
                            India's trusted PCB manufacturing partner delivering precision-engineered boards for startups, engineers, and enterprises.
                        </p>
                        <p className="text-xs text-primary font-semibold italic mb-6 lg:text-right">
                            "From Imagination To Innovation"
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div>© {new Date().getFullYear()} Megabyte Circuit. All Rights Reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
