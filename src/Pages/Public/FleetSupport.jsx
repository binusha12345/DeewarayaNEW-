// FleetContact.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaWhatsapp,
  FaPaperPlane, FaCheckCircle, FaSpinner, FaChevronDown,
  FaAnchor, FaHeadset, FaShieldAlt, FaArrowRight,
  FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram,
  FaGlobe, FaComments, FaClock, FaCheck
} from 'react-icons/fa';
import { GiFishingBoat, GiSailboat } from 'react-icons/gi';
import HomeNavBar from '../../components/HomeNavBar';
import supportHeroImg from '../../assets/support_hero.png';
import supportOperationsImg from '../../assets/support_operations.png';

const FleetContact = () => {
  const { t } = useTranslation();
  const [activeFaq, setActiveFaq] = useState(0);
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: ''
  });
  const [formStatus, setFormStatus] = useState('idle');

  const supportCards = [
    {
      icon: <FaPhoneAlt />,
      title: t("fleetSupport.cards.phone.title", 'Phone Support'),
      desc: t("fleetSupport.cards.phone.desc", '24/7 technical assistance for critical connectivity issues.'),
      linkText: t("fleetSupport.cards.phone.linkText", 'Call Now'),
      href: 'tel:+94784152744',
      borderColor: 'border-l-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      linkColor: 'text-blue-700',
    },
    {
      icon: <FaEnvelope />,
      title: t("fleetSupport.cards.email.title", 'Email Support'),
      desc: t("fleetSupport.cards.email.desc", 'Detailed troubleshooting and non-urgent inquiries.'),
      linkText: t("fleetSupport.cards.email.linkText", 'Email Us'),
      href: 'mailto:support@deewaraya.lk',
      borderColor: 'border-l-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      linkColor: 'text-blue-700',
    },
    {
      icon: <FaComments />,
      title: t("fleetSupport.cards.whatsapp.title", 'WhatsApp Help'),
      desc: t("fleetSupport.cards.whatsapp.desc", 'Quick messaging for fast resolution on the go.'),
      linkText: t("fleetSupport.cards.whatsapp.linkText", 'Message'),
      href: 'https://wa.me/94784152744',
      borderColor: 'border-l-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      linkColor: 'text-green-700',
    },
    {
      icon: <FaGlobe />,
      title: t("fleetSupport.cards.global.title", 'Global Offices'),
      desc: t("fleetSupport.cards.global.desc", 'Locate and contact our international support centers.'),
      linkText: t("fleetSupport.cards.global.linkText", 'Find Offices'),
      href: '#location',
      borderColor: 'border-l-slate-700',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      linkColor: 'text-slate-700',
    }
  ];

  const subjectOptions = [
    t("fleetSupport.form.subjects.technical", 'Technical Support'),
    t("fleetSupport.form.subjects.gps", 'GPS / Tracking Issue'),
    t("fleetSupport.form.subjects.vessel", 'Vessel Management'),
    t("fleetSupport.form.subjects.billing", 'Billing & Plans'),
    t("fleetSupport.form.subjects.demo", 'Request a Demo'),
    t("fleetSupport.form.subjects.feedback", 'General Feedback')
  ];

  const faqData = [
    {
      question: t("fleetSupport.faq.q1.question", 'Why is my vessel showing as offline?'),
      answer: t("fleetSupport.faq.q1.answer", 'Vessels may show offline due to poor satellite coverage, device battery issues, or antenna obstructions. Check the device power indicator and ensure clear sky visibility.')
    },
    {
      question: t("fleetSupport.faq.q2.question", 'How often does the GPS location update?'),
      answer: t("fleetSupport.faq.q2.answer", 'GPS updates every 30 seconds when moving, and every 5 minutes when anchored to conserve battery life.')
    },
    {
      question: t("fleetSupport.faq.q3.question", 'How do I add a new boat to my fleet?'),
      answer: t("fleetSupport.faq.q3.answer", 'Navigate to Dashboard > Fleet Management > Add Vessel. Enter vessel details and tracking device ID to activate.')
    },
    {
      question: t("fleetSupport.faq.q4.question", 'Can I track my fleet from mobile?'),
      answer: t("fleetSupport.faq.q4.answer", 'Yes! Download our mobile app on iOS and Android to monitor vessels in real-time with instant alerts.')
    }
  ];

  const stats = [
    { value: '500+', label: t("fleetSupport.stats.activeVessels", 'Active Vessels') },
    { value: '24/7', label: t("fleetSupport.stats.liveSupport", 'Live Support') },
    { value: '99.9%', label: t("fleetSupport.stats.uptime", 'System Uptime') },
    { value: '<2h', label: t("fleetSupport.stats.responseTime", 'Response Time') }
  ];

  const features = [
    t("fleetSupport.hero.features.0", 'Real-time GPS tracking'),
    t("fleetSupport.hero.features.1", 'Weather & tide monitoring'),
    t("fleetSupport.hero.features.2", 'Emergency SOS system'),
    t("fleetSupport.hero.features.3", 'Fleet analytics dashboard')
  ];

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFormStatus('sent');
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setFormStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Form submission error:', error);
      setFormStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[700px] md:h-[800px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={supportHeroImg}
            alt="Support operations at sea"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
        </div>

        <div className="absolute top-0 left-0 w-full z-20">
          <HomeNavBar />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl mx-auto ml-1 text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-900/30 backdrop-blur-sm px-3 py-2 w-fit">
            <FaHeadset className="text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-400">
              {t("fleetSupport.hero.badge", "Fleet Support")}
            </span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[52px] mb-6">
            {t("fleetSupport.hero.title1", "Reliable Connectivity")} <br />
            <span className="text-cyan-400">{t("fleetSupport.hero.title2", "for Every Fleet.")}</span>
          </h1>

          <div className="w-16 h-1 bg-cyan-500 rounded mb-8" />

          <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 md:text-lg mb-10">
            {t("fleetSupport.hero.description", "Streamline your marine operations with our tactical management system. Expert support available 24/7 across the globe.")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#contact-form"
              className="inline-flex items-center justify-center gap-2 bg-blue-600/80 border border-cyan-800/80 px-8 py-3.5 rounded-lg font-semibold text-sm transition-all hover:bg-cyan-500 hover:border-cyan-500 backdrop-blur-sm text-white"
            >
              {t("fleetSupport.hero.sendMessage", "Send us a message")}
            </a>
            <a
              href="https://wa.me/94784152744"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20 text-white px-8 py-3.5 rounded-lg font-semibold text-sm transition-all backdrop-blur-sm"
            >
              <FaComments className="text-cyan-400" /> {t("fleetSupport.hero.whatsapp", "Chat on WhatsApp")}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1.5: SUPPORT CARDS
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Support Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {supportCards.map((card, i) => (
              <a
                key={i}
                href={card.href}
                target={card.href.startsWith('http') ? '_blank' : undefined}
                rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`group bg-white border border-slate-200 border-l-4 ${card.borderColor} rounded-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-full ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-5 text-lg`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  {card.desc}
                </p>
                <div className={`inline-flex items-center gap-1.5 text-sm font-semibold ${card.linkColor} group-hover:gap-2.5 transition-all`}>
                  {card.linkText} <FaArrowRight className="text-xs" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: HERO IMAGE / OPERATIONS CENTER
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px] md:h-[500px] group">
            {/* Background Image */}
            <img
              src={supportOperationsImg}
              alt="Marine Operations Center"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-2xl px-8 md:px-14 text-white">
                <div className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 px-3 py-1 rounded-full mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold uppercase tracking-wider">{t("fleetSupport.operations.badge", "Operations Live")}</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  {t("fleetSupport.operations.title1", "Monitoring 500+ vessels")}<br />
                  <span className="text-blue-300">{t("fleetSupport.operations.title2", "across the ocean")}</span>
                </h2>
                <p className="text-slate-200 text-sm md:text-base mb-6 max-w-lg">
                  {t("fleetSupport.operations.desc", "Our command center operates around the clock to ensure your fleet stays connected, safe, and efficient.")}
                </p>

                {/* Features list */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <FaCheck className="text-white text-[10px]" />
                      </div>
                      <span className="text-slate-100">{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
                >
                  {t("fleetSupport.operations.getInTouch", "Get in Touch")} <FaArrowRight className="text-xs" />
                </a>
              </div>
            </div>

            {/* Stats overlay bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-6 md:p-8">
              <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-3xl">
                {stats.map((stat, i) => (
                  <div key={i} className="text-white">
                    <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                    <div className="text-xs text-slate-300 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: CONTACT FORM + INFO
          ═══════════════════════════════════════════════════════ */}
      <section id="contact-form" className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{t("fleetSupport.contact.badge", "Contact Form")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              {t("fleetSupport.contact.title", "Let's discuss your fleet")}
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              {t("fleetSupport.contact.desc", "Fill out the form below and our marine experts will get back to you within 24 hours.")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            
            {/* LEFT: Info Panel */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden h-full">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-5">
                    <FaHeadset className="text-lg" />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{t("fleetSupport.contactInfo.title", "Contact Information")}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-8">
                    {t("fleetSupport.contactInfo.desc", "Reach out through any of these channels")}
                  </p>

                  {/* Contact Details */}
                  <div className="space-y-5 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <FaPhoneAlt className="text-blue-300 text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">{t("fleetSupport.contactInfo.callUs", "Call us")}</div>
                        <div className="text-sm font-semibold">+94 78 415 2744</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <FaEnvelope className="text-blue-300 text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">{t("fleetSupport.contactInfo.emailUs", "Email us")}</div>
                        <div className="text-sm font-semibold">support@deewaraya.lk</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <FaMapMarkerAlt className="text-blue-300 text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">{t("fleetSupport.contactInfo.visitUs", "Visit us")}</div>
                        <div className="text-sm font-semibold">{t("fleetSupport.contactInfo.address1", "Ambalangoda Harbour")}</div>
                        <div className="text-xs text-slate-400">{t("fleetSupport.contactInfo.address2", "Balapitiya, Sri Lanka")}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <FaClock className="text-blue-300 text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">{t("fleetSupport.contactInfo.workingHours", "Working hours")}</div>
                        <div className="text-sm font-semibold">{t("fleetSupport.contactInfo.workingHoursValue", "24/7 Available")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="pt-6 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">{t("fleetSupport.contactInfo.followUs", "Follow us")}</p>
                    <div className="flex gap-2">
                      {[FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram].map((Icon, i) => (
                        <a
                          key={i}
                          href="#"
                          className="w-10 h-10 rounded-lg bg-white/5 hover:bg-blue-600 border border-white/10 flex items-center justify-center text-sm transition-all"
                        >
                          <Icon />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                        {t("fleetSupport.form.name", "Full Name *")}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={t("fleetSupport.form.namePlaceholder", "John Smith")}
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                        {t("fleetSupport.form.email", "Email Address *")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t("fleetSupport.form.emailPlaceholder", "you@example.com")}
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                      {t("fleetSupport.form.subjectLabel", "Subject *")}
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>{t("fleetSupport.form.subjectPlaceholder", "Choose a subject...")}</option>
                      {subjectOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                      {t("fleetSupport.form.messageLabel", "Message *")}
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder={t("fleetSupport.form.messagePlaceholder", "Tell us how we can help you...")}
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus !== 'idle'}
                    className={`w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                      formStatus === 'sent'
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-800 hover:bg-blue-900 text-white shadow-md hover:shadow-lg'
                    } ${formStatus === 'sending' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {formStatus === 'idle' && <><FaPaperPlane className="text-xs" /> {t("fleetSupport.form.sendBtn", "Send Message")}</>}
                    {formStatus === 'sending' && <><FaSpinner className="animate-spin" /> {t("fleetSupport.form.sending", "Sending...")}</>}
                    {formStatus === 'sent' && <><FaCheckCircle /> {t("fleetSupport.form.sent", "Message Sent Successfully!")}</>}
                  </button>

                  <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1.5">
                    <FaShieldAlt className="text-green-600" /> {t("fleetSupport.form.secureInfo", "Your information is secure and encrypted")}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: FAQ + MAP
          ═══════════════════════════════════════════════════════ */}
      <section id="location" className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: FAQ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{t("fleetSupport.faqSection.badge", "FAQ")}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t("fleetSupport.faqSection.title", "Frequently Asked Questions")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("fleetSupport.faqSection.desc", "Quick answers to common questions")}
                </p>
              </div>

              <div className="space-y-2">
                {faqData.map((faq, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      activeFaq === index
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                      className="w-full px-4 py-3.5 flex justify-between items-center text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 pr-3">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                          activeFaq === index
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {faq.question}
                        </h4>
                      </div>
                      <FaChevronDown className={`text-xs transition-all duration-300 flex-shrink-0 ${
                        activeFaq === index ? 'rotate-180 text-blue-700' : 'text-slate-400'
                      }`} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        activeFaq === index ? 'max-h-40 pb-3 px-4' : 'max-h-0'
                      }`}
                    >
                      <div className="pl-10">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Map */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
                  <FaMapMarkerAlt className="text-xs text-blue-700" />
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{t("fleetSupport.location.badge", "Our Location")}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t("fleetSupport.location.title", "Visit Our Office")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("fleetSupport.location.desc", "Located at Ambalangoda Fishery Harbour")}
                </p>
              </div>

              <div className="relative rounded-lg overflow-hidden h-[280px] mb-4 border border-slate-200">
                <iframe
                  src="https://maps.google.com/maps?q=6.2345255,80.0525275&hl=en&z=17&output=embed"
                  className="w-full h-full border-none"
                  allowFullScreen
                  loading="lazy"
                  title="Deewaraya - Ambalangoda Harbour"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <FaAnchor className="text-white text-sm" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">{t("fleetSupport.location.hqName", "Deewaraya Headquarters")}</h4>
                  <p className="text-xs text-slate-600 mb-2">
                    {t("fleetSupport.location.hqAddress", "No.102/4 Heenatiya, Balapitiya, Sri Lanka")}
                  </p>
                  <a
                    href="https://maps.google.com/?q=Ambalangoda+Fishery+Harbor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-all"
                  >
                    {t("fleetSupport.location.getDirections", "Get Directions")} <FaArrowRight className="text-[10px]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: FINAL CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {t("fleetSupport.cta.title", "Ready to modernize your fleet?")}
          </h3>
          <p className="text-slate-600 text-base mb-8 max-w-xl mx-auto">
            {t("fleetSupport.cta.desc", "Join hundreds of fleet operators who trust our marine management platform. Get started today.")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#contact-form"
              className="inline-flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-8 py-3.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              {t("fleetSupport.cta.getStarted", "Get Started")} <FaArrowRight className="text-xs" />
            </a>
            <a
              href="https://wa.me/94784152744"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <FaWhatsapp className="text-lg" /> {t("fleetSupport.cta.whatsappBtn", "WhatsApp")}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FLOATING WHATSAPP BUTTON
          ═══════════════════════════════════════════════════════ */}
      <a
        href="https://wa.me/94784152744"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full font-semibold text-sm shadow-2xl shadow-green-500/40 transition-all hover:scale-105 group"
      >
        <FaWhatsapp className="text-lg group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">{t("fleetSupport.floating.needHelp", "Need Help?")}</span>
      </a>
    </div>
  );
};

export default FleetContact;