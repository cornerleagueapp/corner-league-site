import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#f7f7f7] hover:bg-gray-300 text-[#000000] font-medium rounded-md transition-colors">
              <ArrowLeft size={16} />
              Back to Home
            </button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-[#111827a1] rounded-lg p-8 backdrop-blur-sm border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Terms of Service & Privacy Policy</h1>
            
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 space-y-8">
                <div className="text-sm text-gray-400">
                  <strong>Effective Date:</strong> 01/01/2025<br />
                  <strong>Last Updated:</strong> 08/08/2025
                </div>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">1. Introduction and Acceptance</h2>
                  <p className="mb-4">
                    Welcome to our comprehensive sports media and community platform <strong>Corner League</strong>. These Terms of Service ("Terms") constitute a legally binding agreement between you and Corner League governing your access to and use of our sports-focused web application, including all related services, features, content, and applications.
                  </p>
                  <p className="mb-4">
                    Our Platform represents a sophisticated integration of sports media consumption, community building, and artificial intelligence technologies designed to enhance the sports viewing and discussion experience. By providing club management capabilities, real-time streaming integration, interactive chat features, and AI-powered personalization, we create a comprehensive ecosystem for sports enthusiasts to connect, engage, and share their passion for sports content.
                  </p>
                  <p className="mb-4">
                    <strong>Acceptance of Terms:</strong> By accessing, browsing, registering for, or using our Platform in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy, which is incorporated herein by reference. If you do not agree to these Terms in their entirety, you must not access or use our Platform. Your continued use of the Platform following any modifications to these Terms constitutes your acceptance of such modifications.
                  </p>
                  <p className="mb-4">
                    <strong>Legal Capacity:</strong> You represent and warrant that you have the legal capacity to enter into this agreement. If you are under the age of 18, you may only use our Platform with the involvement and consent of a parent or guardian who agrees to be bound by these Terms. If you are using the Platform on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
                  </p>
                  <p className="mb-4">
                    <strong>Scope of Agreement:</strong> These Terms apply to all users of the Platform, including but not limited to casual browsers, registered users, club owners, club members, and any other individuals who interact with our services. The Terms govern all aspects of your relationship with our Platform, including account creation, content creation and consumption, community participation, payment processing, and data handling.
                  </p>
                  <p className="mb-4">
                    <strong>Regulatory Compliance:</strong> Our Platform operates in compliance with applicable laws and regulations worldwide, including but not limited to the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), Digital Millennium Copyright Act (DMCA), and emerging artificial intelligence regulations such as the EU AI Act. We are committed to maintaining the highest standards of legal compliance while providing innovative sports media experiences.
                  </p>
                  <p className="mb-4">
                    <strong>Platform Evolution:</strong> As our Platform continues to evolve and incorporate new technologies, features, and services, these Terms may be updated to reflect such changes. We encourage users to review these Terms periodically to stay informed about their rights and obligations when using our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">2. Platform Description and Services</h2>
                  <p className="mb-4">
                    <strong>Core Platform Functionality:</strong> Our Platform provides a comprehensive sports media and community management system built on modern web technologies, including React frontend architecture, Express.js backend infrastructure, and PostgreSQL database management. The Platform integrates multiple sports content sources, real-time communication capabilities, and artificial intelligence features to create an immersive sports viewing and discussion environment.
                  </p>
                  <p className="mb-4">
                    <strong>Club Management System:</strong> The Platform's primary feature is its sophisticated club management system that allows users to create, manage, and participate in sports-focused communities. Club owners can establish private or public clubs with customizable settings including member limits, streaming sources, and community guidelines. Each club operates as an independent community space with its own membership roster, chat capabilities, and content sharing features. The system supports various club configurations, from intimate private groups to large public communities, accommodating diverse user preferences and engagement styles.
                  </p>
                  <p className="mb-4">
                    <strong>Live Streaming Integration:</strong> Our Platform integrates with multiple streaming sources to provide users with access to sports content. The primary integration includes NFL Network streaming capabilities, allowing clubs to collectively view official NFL content within their community spaces. Additionally, the Platform supports YouTube streaming integration, enabling clubs to share and view YouTube-hosted sports content, highlights, and commentary. This dual-source approach ensures comprehensive coverage of sports content while maintaining compliance with respective content licensing agreements.
                  </p>
                  <p className="mb-4">
                    <strong>Real-Time Communication Features:</strong> The Platform incorporates advanced real-time chat functionality powered by WebSocket technology, enabling instantaneous communication among club members during live sports events. The chat system supports message persistence, user identification, and moderation capabilities. Messages are stored securely in our database system and cached locally for optimal performance. The communication system includes features for message history, user mentions, and real-time typing indicators to enhance the interactive viewing experience.
                  </p>
                  <p className="mb-4">
                    <strong>Artificial Intelligence and Personalization:</strong> Our Platform leverages artificial intelligence technologies to enhance user experience through intelligent caching systems, content recommendations, and personalized features. The AI-powered caching system optimizes data retrieval and storage, reducing load times and improving overall platform performance. Machine learning algorithms analyze user behavior patterns to provide personalized content suggestions and optimize the user interface based on individual preferences and usage patterns.
                  </p>
                  <p className="mb-4">
                    <strong>User Authentication and Security:</strong> The Platform implements robust authentication systems supporting multiple login methods, including traditional email and password authentication. Session management utilizes PostgreSQL-based storage with automatic session refresh capabilities, ensuring secure and persistent user authentication across platform interactions. Security measures include password hashing using industry-standard cryptographic functions and comprehensive session management protocols.
                  </p>
                  <p className="mb-4">
                    <strong>Data Management and Caching:</strong> Our Platform employs a sophisticated multi-layer caching system that includes client-side localStorage persistence and React Query integration for optimal performance. The caching system intelligently manages user data, club information, and chat history with time-to-live (TTL) based expiration mechanisms. This approach ensures rapid data access while maintaining data freshness and accuracy across all platform features.
                  </p>
                  <p className="mb-4">
                    <strong>Monetization and Creator Support:</strong> The Platform integrates with Buy Me a Coffee, a third-party payment processing service, to enable optional monetization for club owners and content creators. This integration allows community members to support their favorite club creators through voluntary contributions, fostering a sustainable ecosystem for high-quality sports content and community management. The monetization features are entirely optional and do not affect core platform functionality.
                  </p>
                  <p className="mb-4">
                    <strong>Mobile and Cross-Platform Compatibility:</strong> Our Platform is designed with responsive web technologies to ensure optimal functionality across desktop, tablet, and mobile devices. The user interface adapts seamlessly to different screen sizes and input methods, providing consistent user experience regardless of the device used to access the Platform. Touch-friendly interfaces and mobile-optimized navigation ensure full feature accessibility on all supported devices.
                  </p>
                  <p className="mb-4">
                    <strong>Content Discovery and Organization:</strong> The Platform provides comprehensive content discovery mechanisms, including public club browsing, search functionality, and categorization systems. Users can explore public clubs based on sports interests, team affiliations, and community size. The organization system includes club descriptions, member counts, activity levels, and streaming preferences to help users find communities that match their interests and viewing preferences.
                  </p>
                  <p className="mb-4">
                    <strong>Performance Monitoring and Analytics:</strong> Our Platform incorporates performance monitoring systems to ensure optimal service delivery and user experience. Analytics capabilities track platform usage patterns, performance metrics, and user engagement levels while maintaining strict privacy compliance. This data helps us continuously improve platform functionality and identify areas for enhancement without compromising user privacy or data security.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts and Registration</h2>
                  <p className="mb-4">
                    <strong>Account Creation Requirements:</strong> To access the full functionality of our Platform, users must create an account by providing accurate, current, and complete information during the registration process. Required information includes a valid email address, unique username, first and last name, and a secure password meeting our security requirements.
                  </p>
                  <p className="mb-4">
                    <strong>Username and Email Uniqueness:</strong> Each user account must have a unique username and email address within our system. Usernames serve as public identifiers within clubs and chat systems, while email addresses are used for account verification, security notifications, and important platform communications. Users are responsible for selecting appropriate usernames that comply with our community guidelines and do not infringe upon the rights of others or violate applicable laws.
                  </p>
                  <p className="mb-4">
                    <strong>Password Security and Management:</strong> Users are required to create strong passwords that meet our security criteria, including minimum length requirements and complexity standards. Passwords are securely hashed using industry-standard cryptographic functions before storage in our database systems. Users are solely responsible for maintaining the confidentiality of their login credentials and for all activities that occur under their account. We strongly recommend using unique passwords not used on other platforms and enabling any additional security features we may provide.
                  </p>
                  <p className="mb-4">
                    <strong>Account Verification and Activation:</strong> Upon registration, users may be required to verify their email address through a confirmation process. This verification helps ensure account security and enables important platform communications. Users must complete any required verification steps before gaining full access to platform features. Failure to complete verification within specified timeframes may result in account restrictions or deletion.
                  </p>
                  <p className="mb-4">
                    <strong>Account Information Accuracy:</strong> Users are responsible for maintaining accurate and up-to-date account information throughout their use of the Platform. This includes promptly updating email addresses, names, and other profile information when changes occur. Providing false, misleading, or outdated information may result in account suspension or termination. Users can update their account information through their profile settings at any time.
                  </p>
                  <p className="mb-4">
                    <strong>Account Security Responsibilities:</strong> Users must take reasonable steps to protect their account security, including logging out of shared devices, not sharing login credentials with others, and promptly notifying us of any suspected unauthorized access to their account. Users should regularly monitor their account activity and report any suspicious or unauthorized activities immediately. We reserve the right to suspend accounts that show signs of compromise or unauthorized access pending security verification.
                  </p>
                  <p className="mb-4">
                    <strong>Multiple Account Restrictions:</strong> Users are generally limited to one account per person unless specifically authorized by us for legitimate business or organizational purposes. Creating multiple accounts to circumvent platform restrictions, manipulate voting or engagement systems, or engage in other prohibited activities is strictly forbidden and may result in termination of all associated accounts.
                  </p>
                  <p className="mb-4">
                    <strong>Account Transferability:</strong> User accounts are personal to the registered user and may not be transferred, sold, or assigned to any other person or entity without our express written consent. Any attempt to transfer account ownership without authorization will result in immediate account termination. This restriction helps maintain platform security and prevents abuse of our systems.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities and Conduct</h2>
                  <p className="mb-4">
                    <strong>Legal Compliance:</strong> Users must comply with all applicable local, state, national, and international laws and regulations when using our Platform. This includes but is not limited to laws governing online conduct, content sharing, privacy, data protection, intellectual property rights, and commercial activities. Users are solely responsible for understanding and adhering to the legal requirements that apply to their use of the Platform in their jurisdiction.
                  </p>
                  <p className="mb-4">
                    <strong>Content Responsibility:</strong> Users are fully responsible for all content they post, share, upload, or otherwise transmit through our Platform. This includes text messages, images, videos, links, and any other materials shared in clubs, chat systems, or other platform features. Users must ensure that their content does not violate these Terms, applicable laws, or the rights of others.
                  </p>
                  <p className="mb-4">
                    <strong>Respectful Community Interaction:</strong> Users must engage with other community members in a respectful, constructive, and appropriate manner. This includes maintaining civil discourse during sports discussions, respecting diverse viewpoints and opinions, and fostering an inclusive environment for all participants regardless of their background, team preferences, or level of sports knowledge.
                  </p>
                  <p className="mb-4">
                    <strong>Intellectual Property Respect:</strong> Users must respect the intellectual property rights of others, including copyrights, trademarks, patents, and other proprietary rights. Users may not post, share, or distribute content that infringes upon the rights of others without proper authorization. This includes sports content, team logos, player images, commentary, and other protected materials.
                  </p>
                  <p className="mb-4">
                    <strong>Accurate Information:</strong> Users must provide truthful and accurate information when creating accounts, participating in discussions, and interacting with other users. Misrepresentation of identity, credentials, affiliations, or other material facts is prohibited and may result in account suspension or termination.
                  </p>
                  <p className="mb-4">
                    <strong>Platform Security:</strong> Users must not attempt to compromise, interfere with, or disrupt the security, integrity, or performance of our Platform. This includes refraining from hacking attempts, unauthorized access to other user accounts, distribution of malware or viruses, and any other activities that could harm our systems or other users.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">5. Club Management and Community Guidelines</h2>
                  <p className="mb-4">
                    <strong>Club Owner Responsibilities:</strong> Club owners have significant responsibilities for managing their communities and ensuring compliance with platform terms and community standards. This includes establishing clear community guidelines, moderating content and member behavior, responding to reported violations, and maintaining an environment that promotes positive engagement among members.
                  </p>
                  <p className="mb-4">
                    <strong>Community Moderation:</strong> Club owners have the authority and responsibility to moderate their communities through various tools and mechanisms. This includes the ability to mute members who violate guidelines, remove inappropriate content, and ban users who consistently engage in disruptive behavior. All moderation actions should be fair, consistent, and aligned with both platform terms and established community guidelines.
                  </p>
                  <p className="mb-4">
                    <strong>Member Guidelines:</strong> All club members must adhere to both platform-wide terms of service and any additional guidelines established by individual club owners. Members are expected to contribute positively to club discussions, respect other members' opinions and perspectives, and follow club-specific rules regarding content sharing, language use, and behavioral expectations.
                  </p>
                  <p className="mb-4">
                    <strong>Content Standards:</strong> Clubs must maintain appropriate content standards that align with platform policies and legal requirements. This includes prohibiting harassment, hate speech, spam, illegal content, and materials that could be harmful to other users or violate intellectual property rights.
                  </p>
                  <p className="mb-4">
                    <strong>Escalation Procedures:</strong> Users who believe they have been unfairly treated by club moderators or who encounter content that violates platform terms may report issues through our designated channels. We reserve the right to review moderation decisions and take appropriate action when necessary to ensure compliance with platform standards.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">6. Content and Intellectual Property</h2>
                  <p className="mb-4">
                    <strong>User Content Ownership:</strong> Users retain ownership of the original content they create and post on our Platform, including text messages, commentary, analysis, and other original materials. However, by posting content on the Platform, users grant us certain rights to use, display, and distribute that content as necessary to provide our services.
                  </p>
                  <p className="mb-4">
                    <strong>Content License to Platform:</strong> By posting content on our Platform, users grant Corner League a non-exclusive, worldwide, royalty-free license to use, copy, display, distribute, and modify their content solely for the purpose of operating and improving our services. This license allows us to show user content to other members of their clubs and to process content through our systems.
                  </p>
                  <p className="mb-4">
                    <strong>Third-Party Content:</strong> Users must not post content that belongs to others without proper authorization. This includes copyrighted materials, trademarked content, and other proprietary information. Users who share third-party content must ensure they have the necessary rights or that their use qualifies as fair use under applicable copyright laws.
                  </p>
                  <p className="mb-4">
                    <strong>DMCA Compliance:</strong> We comply with the Digital Millennium Copyright Act (DMCA) and respond to valid takedown requests for content that infringes upon others' copyrights. Users who believe their copyright has been infringed may submit a DMCA takedown notice through our designated procedures.
                  </p>
                  <p className="mb-4">
                    <strong>Platform Intellectual Property:</strong> All intellectual property rights in the Platform itself, including our software, design, trademarks, logos, and proprietary algorithms, remain the exclusive property of Corner League. Users may not copy, modify, distribute, or create derivative works based on our proprietary technology without express written permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">7. Sports Content and Broadcasting Rights</h2>
                  <p className="mb-4">
                    <strong>Licensed Content Integration:</strong> Our Platform integrates with authorized streaming sources to provide access to sports content within club environments. This integration is subject to the terms and conditions of the respective content providers and broadcasting networks. Users' access to this content is governed by the licensing agreements we maintain with these third-party providers.
                  </p>
                  <p className="mb-4">
                    <strong>Streaming Compliance:</strong> Users must comply with all applicable broadcasting rights and licensing restrictions when accessing streamed content through our Platform. This includes respecting geographic restrictions, usage limitations, and other terms imposed by content providers.
                  </p>
                  <p className="mb-4">
                    <strong>No Content Redistribution:</strong> Users may not record, redistribute, or retransmit any streamed content accessed through our Platform. Such activities may violate broadcasting rights and copyright laws, and users engaging in these activities do so at their own risk and may face legal consequences.
                  </p>
                  <p className="mb-4">
                    <strong>Content Availability:</strong> We do not guarantee the availability, quality, or accuracy of third-party sports content. Streaming availability may be subject to technical limitations, geographic restrictions, licensing changes, or other factors beyond our control.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">8. AI Features and Algorithmic Processing</h2>
                  <p className="mb-4">
                    <strong>AI-Powered Features:</strong> Our Platform incorporates artificial intelligence and machine learning technologies to enhance user experience through personalized recommendations, intelligent caching, content optimization, and automated moderation assistance. These AI features are designed to improve platform performance and user satisfaction while maintaining privacy and security standards.
                  </p>
                  <p className="mb-4">
                    <strong>Data Processing for AI:</strong> Our AI systems may process user interaction data, content preferences, and usage patterns to provide personalized experiences and improve platform functionality. This processing is conducted in accordance with our privacy policy and applicable data protection regulations.
                  </p>
                  <p className="mb-4">
                    <strong>Algorithmic Transparency:</strong> While our specific algorithms are proprietary, we are committed to providing users with meaningful information about how our AI systems affect their experience. Users can adjust certain personalization settings through their account preferences.
                  </p>
                  <p className="mb-4">
                    <strong>AI Limitations:</strong> Users should understand that AI-powered features, while sophisticated, may not always produce perfect results. We continuously work to improve our AI systems, but users should exercise their own judgment when relying on AI-generated recommendations or automated features.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">9. Payment Processing and Monetization</h2>
                  <p className="mb-4">
                    <strong>Buy Me a Coffee Integration:</strong> Our Platform integrates with Buy Me a Coffee, a third-party payment processing service, to enable optional monetization features for club creators. This integration allows community members to voluntarily support their favorite club creators through financial contributions.
                  </p>
                  <p className="mb-4">
                    <strong>Optional Nature of Monetization:</strong> All monetization features are entirely optional and do not affect access to core platform functionality. Users are never required to make payments to join clubs, participate in discussions, or access basic platform features.
                  </p>
                  <p className="mb-4">
                    <strong>Third-Party Payment Processing:</strong> All payment transactions are processed by Buy Me a Coffee and are subject to their terms of service, privacy policy, and payment processing terms. We do not directly handle payment information or financial transactions.
                  </p>
                  <p className="mb-4">
                    <strong>Creator Responsibilities:</strong> Club creators who choose to enable monetization features are responsible for complying with applicable tax laws, financial regulations, and reporting requirements in their jurisdiction. We do not provide tax advice or financial services beyond facilitating connections to third-party payment processors.
                  </p>
                  <p className="mb-4">
                    <strong>No Refund Guarantees:</strong> We do not guarantee refunds for payments made through third-party payment processors. Any refund requests must be handled directly with the respective payment service provider according to their policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">10. Data Processing and Privacy</h2>
                  <p className="mb-4">
                    <strong>Data Collection:</strong> We collect various types of information to provide and improve our services, including personal information provided during account registration (name, email, username), content and communications shared on the platform, usage information and interaction patterns, technical information such as IP addresses and device characteristics, and preferences and settings configurations.
                  </p>
                  <p className="mb-4">
                    <strong>Data Use:</strong> We use collected information for multiple purposes: providing and maintaining platform services, facilitating communication between users, personalizing user experience and content recommendations, ensuring platform security and preventing abuse, communicating important updates and notifications, analyzing platform usage to improve functionality, and complying with legal obligations and law enforcement requests.
                  </p>
                  <p className="mb-4">
                    <strong>Data Sharing:</strong> We do not sell personal information to third parties. We may share data in limited circumstances: with service providers who assist in platform operations under confidentiality agreements, when required by law or legal process, to protect our rights and the safety of users, with user consent for specific purposes, and in connection with business transfers or mergers.
                  </p>
                  <p className="mb-4">
                    <strong>Data Security:</strong> We implement industry-standard security measures to protect user data, including encryption of sensitive information, secure data transmission protocols, regular security audits and updates, access controls and authentication systems, and incident response procedures for potential data breaches.
                  </p>
                  <p className="mb-4">
                    <strong>User Rights:</strong> Users have various rights regarding their personal data: access to information about data collection and use, ability to update or correct personal information, right to request data deletion in certain circumstances, control over certain data sharing and processing activities, and ability to export personal data in portable formats where technically feasible.
                  </p>
                  <p className="mb-4">
                    <strong>Data Retention:</strong> We retain personal information for as long as accounts are active or as needed to provide services. We may retain certain information for longer periods as required by law, for legitimate business purposes such as fraud prevention and security, or for dispute resolution. Users can request data deletion, subject to legal and operational requirements.
                  </p>
                  <p className="mb-4">
                    <strong>International Data Transfers:</strong> Our services may involve international data transfers to provide global platform functionality. We ensure appropriate safeguards are in place for international transfers in compliance with applicable data protection regulations.
                  </p>
                  <p className="mb-4">
                    <strong>Privacy Controls:</strong> Users can manage various privacy settings through their account preferences, including communication preferences, data sharing settings, and personalization controls. We provide clear information about available privacy options and how to access them.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">11. Third-Party Integrations and Services</h2>
                  <p className="mb-4">
                    <strong>Integrated Services:</strong> Our Platform integrates with various third-party services to enhance functionality and user experience. These integrations include streaming providers (NFL Network, YouTube), payment processors (Buy Me a Coffee), authentication services, content delivery networks, analytics services, and other technology providers that support platform operations.
                  </p>
                  <p className="mb-4">
                    <strong>Third-Party Terms:</strong> Use of integrated third-party services is subject to their respective terms of service, privacy policies, and other applicable agreements. Users are responsible for reviewing and complying with these third-party terms when using integrated services through our Platform.
                  </p>
                  <p className="mb-4">
                    <strong>Limited Control:</strong> We do not control third-party services and are not responsible for their availability, functionality, content, or practices. Third-party service interruptions, changes, or discontinuations may affect platform functionality, and we cannot guarantee continuous availability of integrated services.
                  </p>
                  <p className="mb-4">
                    <strong>Data Sharing with Third Parties:</strong> Some platform features may require sharing certain user data with third-party service providers to enable functionality. We limit such data sharing to what is necessary for service provision and require appropriate privacy protections from third-party partners.
                  </p>
                  <p className="mb-4">
                    <strong>Third-Party Links:</strong> Our Platform may contain links to external websites or services. We do not endorse or take responsibility for the content, privacy practices, or terms of these external sites. Users access third-party links at their own risk and should review applicable terms and policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">12. Platform Availability and Technical Requirements</h2>
                  <p className="mb-4">
                    <strong>Service Availability:</strong> We strive to maintain platform availability and reliability, but we cannot guarantee uninterrupted or error-free service. Platform availability may be affected by maintenance, updates, technical issues, third-party service dependencies, or other factors beyond our reasonable control.
                  </p>
                  <p className="mb-4">
                    <strong>Technical Requirements:</strong> Users are responsible for maintaining compatible devices, internet connections, and software necessary to access our Platform. We provide general guidance on technical requirements but cannot guarantee compatibility with all devices or configurations.
                  </p>
                  <p className="mb-4">
                    <strong>Platform Updates:</strong> We regularly update our Platform to improve functionality, security, and user experience. Some updates may be automatic, while others may require user action. We reserve the right to modify platform features and capabilities as needed for operational, security, or legal reasons.
                  </p>
                  <p className="mb-4">
                    <strong>Maintenance and Downtime:</strong> Scheduled maintenance may temporarily interrupt platform availability. We will provide advance notice when possible for planned maintenance activities. Emergency maintenance or security updates may be implemented without prior notice.
                  </p>
                  <p className="mb-4">
                    <strong>Geographic Limitations:</strong> Platform availability and certain features may be restricted in specific geographic regions due to legal requirements, licensing limitations, or technical constraints. We do not guarantee global availability of all platform features.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">13. Prohibited Activities and Content Moderation</h2>
                  <p className="mb-4">
                    <strong>Prohibited Content:</strong> Users may not post, share, or transmit content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, invasive of privacy, hateful, or discriminatory. This includes content that promotes violence, contains explicit sexual material, involves illegal activities, infringes intellectual property rights, or could harm minors.
                  </p>
                  <p className="mb-4">
                    <strong>Prohibited Activities:</strong> Prohibited activities include but are not limited to: attempting to gain unauthorized access to accounts or systems, distributing malware or viruses, engaging in spam or unsolicited commercial communications, impersonating others or providing false identity information, manipulating platform features or attempting to circumvent security measures, and interfering with other users' enjoyment of the Platform.
                  </p>
                  <p className="mb-4">
                    <strong>Content Moderation:</strong> We employ various content moderation mechanisms, including automated systems, user reporting, and human review. We reserve the right to remove content, issue warnings, temporarily suspend accounts, or permanently terminate accounts for violations of these terms or community standards.
                  </p>
                  <p className="mb-4">
                    <strong>Reporting Mechanisms:</strong> Users can report content or behavior that violates platform terms through designated reporting channels. We investigate reports in accordance with our policies and take appropriate action based on the severity and nature of violations.
                  </p>
                  <p className="mb-4">
                    <strong>Appeal Process:</strong> Users who believe their content was incorrectly removed or their account was unfairly restricted may appeal through our designated processes. We review appeals fairly and will restore content or access when appropriate.
                  </p>
                  <p className="mb-4">
                    <strong>Law Enforcement Cooperation:</strong> We may cooperate with law enforcement agencies when required by law or when we have good faith belief that cooperation is necessary to prevent harm, investigate illegal activities, or protect our rights and the rights of others.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">14. Termination and Account Suspension</h2>
                  <p className="mb-4">
                    <strong>Termination Rights:</strong> We may terminate or suspend user accounts at any time, with or without prior notice, for violations of these Terms, applicable laws, community guidelines, or for any other reason at our sole discretion. Users may also delete their accounts at any time through account settings or by contacting our support team.
                  </p>
                  <p className="mb-4">
                    <strong>Grounds for Termination:</strong> Account termination may result from repeated violations of platform terms, serious misconduct that threatens other users or platform integrity, illegal activities, attempts to circumvent security measures, abuse of platform features, or failure to comply with legal requirements.
                  </p>
                  <p className="mb-4">
                    <strong>Suspension Procedures:</strong> Temporary account suspensions may be imposed for less severe violations or while investigations are ongoing. Suspended users will receive information about the reason for suspension and any requirements for account restoration when applicable.
                  </p>
                  <p className="mb-4">
                    <strong>Effects of Termination:</strong> Upon account termination, users immediately lose access to all platform features and services. Terminated users may not create new accounts without express authorization. We may retain certain information as permitted by law and our privacy policies.
                  </p>
                  <p className="mb-4">
                    <strong>Data Handling After Termination:</strong> Following account termination, we will handle user data in accordance with our privacy policy and applicable legal requirements. Users may request data export before termination, subject to technical limitations and legal constraints.
                  </p>
                  <p className="mb-4">
                    <strong>Survival of Terms:</strong> Certain provisions of these Terms will survive account termination, including intellectual property rights, limitation of liability, indemnification obligations, and dispute resolution procedures.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">15. Limitation of Liability and Disclaimers</h2>
                  <p className="mb-4">
                    <strong>Service Disclaimers:</strong> Our Platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranties arising from course of dealing or usage of trade.
                  </p>
                  <p className="mb-4">
                    <strong>Limitation of Damages:</strong> To the fullest extent permitted by applicable law, we are not liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, arising from or relating to your use of the Platform, even if we have been advised of the possibility of such damages.
                  </p>
                  <p className="mb-4">
                    <strong>Maximum Liability:</strong> Our total liability to any user for all claims arising from or relating to the Platform will not exceed the greater of $100 or the amount paid by the user to us in the twelve months preceding the claim.
                  </p>
                  <p className="mb-4">
                    <strong>Third-Party Content:</strong> We are not responsible for content, services, or products provided by third parties through our Platform or linked services. Users access third-party content and services at their own risk.
                  </p>
                  <p className="mb-4">
                    <strong>User Content:</strong> We do not endorse, guarantee, or assume responsibility for user-generated content. Users are solely responsible for their content and interactions with other users.
                  </p>
                  <p className="mb-4">
                    <strong>Technical Issues:</strong> We are not liable for damages resulting from technical issues, service interruptions, data loss, security breaches, or other technical problems that may occur despite our reasonable efforts to maintain platform security and reliability.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">16. Indemnification</h2>
                  <p className="mb-4">
                    <strong>User Indemnification:</strong> Users agree to indemnify, defend, and hold harmless Corner League, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorney fees) arising from or relating to user's use of the Platform, violation of these Terms, infringement of rights of others, or any content posted or shared by the user.
                  </p>
                  <p className="mb-4">
                    <strong>Scope of Indemnification:</strong> This indemnification obligation covers claims arising from user conduct, content violations, intellectual property infringement, privacy violations, illegal activities, breach of these Terms, and any harm caused to other users or third parties.
                  </p>
                  <p className="mb-4">
                    <strong>Defense and Settlement:</strong> We reserve the right to assume the exclusive defense and control of any matter for which users are required to indemnify us, and users agree to cooperate with our defense of such claims. Users may not settle any claim without our prior written consent.
                  </p>
                  <p className="mb-4">
                    <strong>Notice Requirements:</strong> We will provide prompt notice to users of any claims for which indemnification may be required, although failure to provide timely notice will not relieve indemnification obligations except to the extent users are materially prejudiced by such failure.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">17. Dispute Resolution and Governing Law</h2>
                  <p className="mb-4">
                    <strong>Governing Law:</strong> These Terms and any disputes arising from or relating to the Platform will be governed by and construed in accordance with the laws of the state of Delaware, without regard to conflict of law principles.
                  </p>
                  <p className="mb-4">
                    <strong>Dispute Resolution Process:</strong> Before pursuing formal legal action, parties agree to attempt good faith resolution of disputes through direct negotiation. If negotiation fails, disputes may be subject to binding arbitration as outlined in these Terms.
                  </p>
                  <p className="mb-4">
                    <strong>Arbitration Agreement:</strong> Any dispute, claim, or controversy arising from or relating to these Terms or the Platform shall be resolved through binding arbitration administered by a recognized arbitration organization. Arbitration will be conducted on an individual basis and not as part of any class action.
                  </p>
                  <p className="mb-4">
                    <strong>Exceptions to Arbitration:</strong> Certain disputes may be exempt from arbitration requirements, including claims for intellectual property infringement, violations of privacy rights, and requests for emergency injunctive relief.
                  </p>
                  <p className="mb-4">
                    <strong>Jurisdiction and Venue:</strong> For disputes not subject to arbitration, parties consent to the exclusive jurisdiction and venue of courts located in the state of Delaware. Users waive any objections to jurisdiction or venue in such courts.
                  </p>
                  <p className="mb-4">
                    <strong>Statute of Limitations:</strong> Any claims arising from or relating to the Platform must be brought within one year after the cause of action arises, or such claims will be permanently barred.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">18. International Compliance</h2>
                  <p className="mb-4">
                    <strong>Global Operations:</strong> Our Platform operates internationally and serves users in multiple jurisdictions. We strive to comply with applicable laws and regulations in jurisdictions where we operate, including data protection laws, content regulations, and consumer protection requirements.
                  </p>
                  <p className="mb-4">
                    <strong>Regional Restrictions:</strong> Certain platform features, content, or services may not be available in all geographic regions due to legal restrictions, licensing limitations, or technical constraints. We reserve the right to restrict access to specific features or content based on user location.
                  </p>
                  <p className="mb-4">
                    <strong>Data Protection Compliance:</strong> We comply with applicable data protection regulations, including the General Data Protection Regulation (GDPR) for European users and the California Consumer Privacy Act (CCPA) for California residents. Users in these jurisdictions have specific rights regarding their personal data as outlined in our Privacy Policy.
                  </p>
                  <p className="mb-4">
                    <strong>Content Localization:</strong> We may modify or restrict content based on local laws and cultural considerations in different regions. Content availability may vary by jurisdiction to ensure compliance with local regulations.
                  </p>
                  <p className="mb-4">
                    <strong>Legal Cooperation:</strong> We cooperate with law enforcement and regulatory authorities in various jurisdictions as required by applicable laws and legal processes. This cooperation may involve disclosure of user information or content when legally compelled.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">19. Changes to Terms</h2>
                  <p className="mb-4">
                    <strong>Modification Rights:</strong> We reserve the right to modify, update, or change these Terms at any time to reflect changes in our services, applicable laws, business practices, or regulatory requirements. We will make reasonable efforts to provide notice of material changes to these Terms.
                  </p>
                  <p className="mb-4">
                    <strong>Notice of Changes:</strong> We will notify users of material changes to these Terms through various methods, including posting updated Terms on our Platform with a revised "Last Updated" date, sending email notifications to registered users, displaying prominent notices on the Platform, or other appropriate communication methods.
                  </p>
                  <p className="mb-4">
                    <strong>Effective Date:</strong> Changes to these Terms will become effective on the date specified in the updated Terms or, if no date is specified, on the date the updated Terms are posted on our Platform. Users' continued use of the Platform after the effective date constitutes acceptance of the updated Terms.
                  </p>
                  <p className="mb-4">
                    <strong>Rejection of Changes:</strong> If users do not agree to updated Terms, they must discontinue use of the Platform and may delete their accounts. Continued use of the Platform after changes become effective indicates acceptance of the updated Terms.
                  </p>
                  <p className="mb-4">
                    <strong>Historical Versions:</strong> We may maintain historical versions of these Terms for reference purposes, but the current version posted on our Platform governs all use of our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">20. Contact Information</h2>
                  <p className="mb-4">
                    <strong>General Inquiries:</strong> If you have questions about these Terms, our privacy practices, platform features, or any other aspect of our services, please contact us through the contact form available on our Platform or through other support channels we may provide.
                  </p>
                  <p className="mb-4">
                    <strong>Legal Notices:</strong> For formal legal communications, copyright notices, or other official correspondence, please contact us through our designated legal channels. We will provide specific contact information for legal matters upon request through our official support systems.
                  </p>
                  <p className="mb-4">
                    <strong>Response Times:</strong> We strive to respond to all inquiries in a timely manner, typically within a reasonable timeframe based on the nature and complexity of the inquiry. Response times may vary based on volume and the specific nature of requests.
                  </p>
                  <p className="mb-4">
                    <strong>Support Channels:</strong> We maintain various support channels to assist users with different types of inquiries, including technical support, account issues, privacy concerns, and general questions about platform functionality.
                  </p>
                  <p className="mb-4">
                    <strong>Business Information:</strong> Additional business and legal information, including our registered address and corporate details, will be provided upon request through appropriate channels or as required by applicable laws and regulations.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}