'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Phone,
  CreditCard,
  Link2,
  Shuffle,
  Sparkles,
  BarChart3,
  Search,
  ChevronRight,
  Send,
  HelpCircle,
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

// Arrow interface for screen annotations
interface ArrowAnnotation {
  top: number;      // percentage from top (e.g. 50 = 50%)
  left: number;     // percentage from left
  direction: 'up' | 'down' | 'left' | 'right';
  label?: string;   // text badge for the arrow
  color?: 'red' | 'blue';
}

interface DocScreen {
  id: string;
  name: string;
  screenshot: string;
  arrows: ArrowAnnotation[];
  purpose: string;
  steps: string[];
  actions: { name: string; description: string }[];
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  screens: DocScreen[];
}

// Full 12 screenshots documentation data structured into 6 sections
const docSections: DocSection[] = [
  {
    id: "phone-numbers",
    title: "AI Phone Numbers Setup",
    description: "Learn how to manage, provision, and connect your business lines to CallPilot's AI voice systems.",
    icon: Phone,
    screens: [
      {
        id: "phone-numbers-list",
        name: "Managing Active Phone Numbers",
        screenshot: "/help/phone-numbers-list.png",
        arrows: [
          { top: 40, left: 24, direction: "down", label: "Buy New Number", color: "red" },
          { top: 50.5, left: 93, direction: "right", label: "Release Number", color: "blue" }
        ],
        purpose: "This dashboard displays all provisioned phone numbers in your organization. You can see their active status, attached call flows, and release or provision numbers from here.",
        steps: [
          "Navigate to 'AI Phone Numbers' in the sidebar menu.",
          "Check the list to verify which call builder flow is assigned to each active number.",
          "Click the '+ Buy AI Number' button at the top-right to provision a new business line.",
          "To disconnect a number permanently, click the 'Release' button on its row."
        ],
        actions: [
          { name: "+ Buy AI Number Button", description: "Launches the number search and selection wizard to purchase a new phone number." },
          { name: "Release Button", description: "Instantly terminates the selected phone number, removing it from your active lines." }
        ]
      },
      {
        id: "buy-phone-number-modal",
        name: "Purchasing a New Number",
        screenshot: "/help/buy-phone-number-modal.png",
        arrows: [
          { top: 71.5, left: 54, direction: "up", label: "Confirm Purchase", color: "red" },
          { top: 57, left: 43, direction: "left", label: "Add Card", color: "blue" }
        ],
        purpose: "The number checkout modal allows you to choose your payment method and authorize a recurring monthly subscription for the selected AI phone number.",
        steps: [
          "Select the provisioned phone number you want to claim.",
          "Choose an existing payment card from the payment method dropdown list.",
          "If no card is saved, click the '+ Add payment method' link to add one.",
          "Click the 'Buy AI Number' button to finalize your recurring order."
        ],
        actions: [
          { name: "Buy AI Number Button", description: "Performs verification and charges the monthly fee, activating the number on your account." },
          { name: "+ Add payment method Link", description: "Opens a secure form card overlay to record a new credit or debit card." }
        ]
      },
      {
        id: "add-payment-method-modal",
        name: "Registering a Payment Method",
        screenshot: "/help/add-payment-method-modal.png",
        arrows: [
          { top: 37, left: 58, direction: "down", label: "Enter Card Details", color: "red" },
          { top: 89, left: 70, direction: "up", label: "Save Card", color: "blue" }
        ],
        purpose: "This drawer provides a secure portal powered by Stripe to add credit cards for your subscription plans and voice allocations.",
        steps: [
          "Enter your credit card number, expiration date, and CVC code in the standard fields.",
          "Type the cardholder name matching your billing statements.",
          "Input your billing zip code and select your country.",
          "Optionally check the 'Set as default payment method' checkbox.",
          "Click 'Add payment method' to register the card details."
        ],
        actions: [
          { name: "Add payment method Button", description: "Triggers Stripe Tokenization and saves the card details to your wallet profile." },
          { name: "Cancel Button", description: "Exits the card entry drawer without saving changes." }
        ]
      }
    ]
  },
  {
    id: "billing",
    title: "Account & Billing Systems",
    description: "Manage subscription plans, track monthly limits, and add supplementary call minutes to your wallet balance.",
    icon: CreditCard,
    screens: [
      {
        id: "billing-overview",
        name: "Billing & Usage Overview",
        screenshot: "/help/billing-overview.png",
        arrows: [
          { top: 50, left: 78, direction: "down", label: "Upgrade Account", color: "red" },
          { top: 26, left: 20, direction: "up", label: "Manage Cards", color: "blue" }
        ],
        purpose: "This panel gives administrative control over your account plan tier, remaining call time quota, and linked payment accounts.",
        steps: [
          "Access the page by clicking Settings (bottom sidebar) -> Billing.",
          "View the remaining minutes quota in the usage metrics container.",
          "To purchase or upgrade to a subscription tier, click the 'Choose a Plan' action.",
          "Navigate between Overview, Payment methods, and Billing history tabs to manage invoices and cards."
        ],
        actions: [
          { name: "Choose a Plan Button", description: "Opens the monthly subscription list to select or adjust your plan tier." },
          { name: "Navigation Tabs", description: "Switch views to see linked cards, update default payment profiles, or download PDF receipts." }
        ]
      },
      {
        id: "create-subscription-modal",
        name: "Subscribing to a Plan",
        screenshot: "/help/create-subscription-modal.png",
        arrows: [
          { top: 45, left: 35, direction: "down", label: "Select Plan Tier", color: "red" },
          { top: 88, left: 65, direction: "up", label: "Confirm Subscription", color: "blue" }
        ],
        purpose: "This interface outlines pricing tiers (Starter, Growing, Pro) tailored to different candidate screening volumes.",
        steps: [
          "Select the card matching the tier you need (e.g. Starter, Pro, or Growing).",
          "Ensure your active payment method is selected in the billing card dropdown.",
          "Review the monthly pricing terms and quotas.",
          "Click the 'Create Subscription Plan' button to process the subscription update."
        ],
        actions: [
          { name: "Create Subscription Plan Button", description: "Subscribes your organization to the selected plan and unlocks its corresponding feature limits." }
        ]
      },
      {
        id: "add-minutes-modal",
        name: "Purchasing Minutes Add-on",
        screenshot: "/help/add-minutes-modal.png",
        arrows: [
          { top: 30, left: 50, direction: "down", label: "Enter Minutes", color: "red" },
          { top: 75, left: 68, direction: "up", label: "Complete Purchase", color: "blue" }
        ],
        purpose: "Use the minutes add-on modal to purchase extra talk time if you exhaust your active plan's standard monthly quota.",
        steps: [
          "Input the number of extra minutes you wish to buy.",
          "Observe the live total cost calculation based on your plan's per-minute rate.",
          "Verify the selected card from your payment profile dropdown.",
          "Click 'Continue' to process the credit charge and add talk time to your balance."
        ],
        actions: [
          { name: "Continue Button", description: "Authorizes the payment transaction and instantly updates your organizational minutes balance." }
        ]
      }
    ]
  },
  {
    id: "integrations",
    title: "ATS Integrations Connection",
    description: "Link third-party applicant tracking systems (ATS) like Greenhouse or JobAdder to CallPilot.",
    icon: Link2,
    screens: [
      {
        id: "connect-ats-integrations",
        name: "Connecting ATS Platforms",
        screenshot: "/help/connect-ats-integrations.png",
        arrows: [
          { top: 55, left: 73, direction: "right", label: "Connect Greenhouse", color: "red" },
          { top: 29, left: 73, direction: "right", label: "Connect JobAdder", color: "blue" }
        ],
        purpose: "A unified dashboard listing compatible applicant tracking databases for syncing candidate contact cards and posting AI verdict outcomes.",
        steps: [
          "Go to Connect ATS in the sidebar navigation.",
          "Browse to find your ATS provider (JobAdder, Recruit CRM, Greenhouse, etc.).",
          "Click the 'Connect' button on the provider's card.",
          "Follow the OAuth login popup to log into your recruitment account and authorize CallPilot access."
        ],
        actions: [
          { name: "Connect Button", description: "Triggers the authorization window to connect candidate pipelines between CallPilot and your ATS." }
        ]
      }
    ]
  },
  {
    id: "flows",
    title: "AI Call Flows Builder",
    description: "Map out the conversational paths, scripting blueprints, and parameters for your automated calling agents.",
    icon: Shuffle,
    screens: [
      {
        id: "ai-call-builder-flows",
        name: "Managing Call Flows",
        screenshot: "/help/ai-call-builder-flows.png",
        arrows: [
          { top: 48, left: 48, direction: "down", label: "Configure Settings", color: "red" },
          { top: 18, left: 86, direction: "down", label: "Open Templates Store", color: "blue" }
        ],
        purpose: "This portal lists all active conversational flows in your account, serving as the workspace for configuring screen layouts.",
        steps: [
          "Open the 'AI Call Builder' page from the main menu.",
          "Check the list of current flows, displaying names, bookmarks, and statuses.",
          "Click 'Configure' on a flow card to map its trigger events, telephone numbers, and voice options.",
          "Click 'AI Call Flow Options' at the top-right to view new templates from the Flow Store."
        ],
        actions: [
          { name: "Configure Button", description: "Opens the flow settings page to assign numbers, choose voices, and schedule active call times." },
          { name: "AI Call Flow Options Button", description: "Directs you to the Flow Store containing public template layouts." }
        ]
      }
    ]
  },
  {
    id: "flow-store",
    title: "CallPilot Flow Store Templates",
    description: "Browse pre-built conversational agents, import screening scripts, and deploy active telephony schedules.",
    icon: Sparkles,
    screens: [
      {
        id: "flow-store-templates",
        name: "Browsing the Flow Store",
        screenshot: "/help/flow-store-templates.png",
        arrows: [
          { top: 48, left: 80, direction: "right", label: "View Template", color: "red" },
          { top: 35, left: 20, direction: "right", label: "Filter Categories", color: "blue" }
        ],
        purpose: "The public repository of ready-to-use AI agents built for common industry routines like diner orders, lead qualifications, or candidate interviews.",
        steps: [
          "Navigate to the Flow Store (accessible via AI Call Builder flow options).",
          "Use the left-hand category lists (All, Recruiting, Food Service) to filter templates.",
          "Use the top search bar to locate specific conversational blueprints.",
          "Click 'View' on any flow card to examine its technical specifications and prompt steps."
        ],
        actions: [
          { name: "View Button", description: "Launches the detailed flow specs sheet for the selected template." },
          { name: "Category Filters", description: "Dynamically restricts visible template cards based on industry application." }
        ]
      },
      {
        id: "flow-template-details",
        name: "Reviewing Template Details",
        screenshot: "/help/flow-template-details.png",
        arrows: [
          { top: 70.5, left: 57, direction: "up", label: "Import Flow", color: "red" },
          { top: 70.5, left: 67, direction: "up", label: "Save to Bookmarks", color: "blue" }
        ],
        purpose: "A full inspection sheet detailing how the bot operates, its required integrations, compatibilities, and prompt workflows.",
        steps: [
          "Read 'How It Works' to understand the script steps and conversational flow rules.",
          "Check the 'Required Resources' and 'Compatible ATS' boxes to verify prerequisites.",
          "Click the bookmark icon to save this template for later import.",
          "Click 'Add To Your Flows' to copy the agent template into your custom dashboard list."
        ],
        actions: [
          { name: "Add To Your Flows Button", description: "Duplicates this template directly into your organizational flow builder library." },
          { name: "Bookmark Button", description: "Adds the selected flow to your personal bookmark list for quick access." }
        ]
      },
      {
        id: "configure-call-flow",
        name: "Configuring & Activating a Flow",
        screenshot: "/help/configure-call-flow.png",
        arrows: [
          { top: 61, left: 50, direction: "down", label: "Choose AI Voice", color: "blue" },
          { top: 92, left: 57, direction: "up", label: "Deploy AI Flow", color: "red" }
        ],
        purpose: "The configuration workbench where imported templates are bound to phone lines, time zones, voices, and sync configurations.",
        steps: [
          "Select the target ATS platform and campaign folder from the settings dropdown.",
          "Select the provisioned phone number to receive incoming screening calls.",
          "Choose an ElevenLabs Voice type from the library selector.",
          "Adjust timezone and setup the active weekly schedule calendar (start/end times).",
          "Click 'Activate AI Call' to deploy the configuration live to the selected number."
        ],
        actions: [
          { name: "Activate AI Call Button", description: "Binds the configuration and takes the AI telephone agent live on the selected line." },
          { name: "Release Flow Button", description: "Stops active screening processes and releases the assigned parameters." }
        ]
      }
    ]
  },
  {
    id: "reports",
    title: "Call Activity & Analytics Reports",
    description: "Examine detailed screening reports, review automated decisions, and read call transcripts.",
    icon: BarChart3,
    screens: [
      {
        id: "call-activity-report",
        name: "Analyzing Candidate Activity Reports",
        screenshot: "/help/call-activity-report.png",
        arrows: [
          { top: 55, left: 92, direction: "down", label: "View Chat Transcript", color: "red" },
          { top: 55, left: 70, direction: "down", label: "Read AI Verdict", color: "blue" }
        ],
        purpose: "A summary table showing caller details, conversation transcripts, recall recommendations, and automated AI grading badges.",
        steps: [
          "Go to Call Activity or click Reports from your active campaign dashboard.",
          "Examine key metric cards (Total Calls, Candidate Completion, Hours Saved).",
          "Browse the candidate screening table to check 'AI Decision' status badges (Green, Yellow, Red).",
          "Click the 'View' link in the Chat History column of a candidate to view the full dialogue transcript."
        ],
        actions: [
          { name: "View Chat History Link", description: "Opens the modal overlay displaying the exact text transcripts of the candidate's call." },
          { name: "AI Decision Badge", description: "Color-coded tag (e.g. green for highly suitable) showing the automated candidate grade verdict." }
        ]
      }
    ]
  }
];

// Single Annotation Arrow Render Component
const ArrowOverlay = ({ arrow }: { arrow: ArrowAnnotation }) => {
  const colorClass = arrow.color === 'blue' ? 'text-blue-500 dark:text-blue-400' : 'text-red-500 dark:text-red-400';
  const bgClass = arrow.color === 'blue' ? 'bg-blue-600 dark:bg-blue-500' : 'bg-red-600 dark:bg-red-500';
  const borderClass = arrow.color === 'blue' ? 'border-blue-400' : 'border-red-400';

  let transformStyle = '';
  let svgContent = null;

  switch (arrow.direction) {
    case 'down':
      transformStyle = 'translate(-50%, calc(-100% - 15px))';
      svgContent = (
        <svg className={`w-9 h-9 ${colorClass} filter drop-shadow-md`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 2v14.17l-3.59-3.59L6 14l6 6 6-6-1.41-1.41L13 16.17V2h-2z" />
        </svg>
      );
      break;
    case 'up':
      transformStyle = 'translate(-50%, 15px)';
      svgContent = (
        <svg className={`w-9 h-9 ${colorClass} filter drop-shadow-md`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 22v-14.17l3.59 3.59L18 10l-6-6-6 6 1.41 1.41L11 7.83V22h2z" />
        </svg>
      );
      break;
    case 'left':
      transformStyle = 'translate(15px, -50%)';
      svgContent = (
        <svg className={`w-9 h-9 ${colorClass} filter drop-shadow-md`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 13H7.83l3.59 3.59L10 18l-6-6 6-6 1.41 1.41L7.83 11H22v2z" />
        </svg>
      );
      break;
    case 'right':
      transformStyle = 'translate(calc(-100% - 15px), -50%)';
      svgContent = (
        <svg className={`w-9 h-9 ${colorClass} filter drop-shadow-md`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 11h14.17l-3.59-3.59L14 6l6 6-6 6-1.41-1.41L16.17 13H2v-2z" />
        </svg>
      );
      break;
  }

  const isHorizontal = arrow.direction === 'left' || arrow.direction === 'right';

  return (
    <div
      className={`absolute z-10 flex select-none ${
        isHorizontal ? 'flex-row items-center gap-1.5' : 'flex-col items-center'
      }`}
      style={{
        top: `${arrow.top}%`,
        left: `${arrow.left}%`,
        transform: transformStyle,
      }}
    >
      {/* Label for right direction (placed to the left of the arrow) */}
      {arrow.label && arrow.direction === 'right' && (
        <div className={`${bgClass} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md border ${borderClass} whitespace-nowrap animate-pulse`}>
          {arrow.label}
        </div>
      )}

      {/* Label for down direction (placed above the arrow) */}
      {arrow.label && arrow.direction === 'down' && (
        <div className={`${bgClass} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md border ${borderClass} mb-1 whitespace-nowrap animate-pulse`}>
          {arrow.label}
        </div>
      )}

      <div className="animate-bounce">
        {svgContent}
      </div>

      {/* Label for up direction (placed below the arrow) */}
      {arrow.label && arrow.direction === 'up' && (
        <div className={`${bgClass} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md border ${borderClass} mt-1 whitespace-nowrap animate-pulse`}>
          {arrow.label}
        </div>
      )}

      {/* Label for left direction (placed to the right of the arrow) */}
      {arrow.label && arrow.direction === 'left' && (
        <div className={`${bgClass} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md border ${borderClass} whitespace-nowrap animate-pulse`}>
          {arrow.label}
        </div>
      )}
    </div>
  );
};

// Reusable Responsive Annotated Image Component
const AnnotatedScreenshot = ({ src, alt, arrows }: { src: string; alt: string; arrows: ArrowAnnotation[] }) => {
  return (
    <div className="relative inline-block w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-lg">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover max-w-full block"
      />
    </div>
  );
};

export function HelpsContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("phone-numbers");
  
  // Section refs for smooth scrolling
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleScrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter sections and screens based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docSections;

    const query = searchQuery.toLowerCase();
    return docSections
      .map(section => {
        // If section title/description matches, keep it whole
        const sectionMatches =
          section.title.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query);

        if (sectionMatches) return section;

        // Otherwise filter down to screens that match
        const matchingScreens = section.screens.filter(screen => {
          return (
            screen.name.toLowerCase().includes(query) ||
            screen.purpose.toLowerCase().includes(query) ||
            screen.steps.some(step => step.toLowerCase().includes(query)) ||
            screen.actions.some(action =>
              action.name.toLowerCase().includes(query) ||
              action.description.toLowerCase().includes(query)
            )
          );
        });

        if (matchingScreens.length > 0) {
          return {
            ...section,
            screens: matchingScreens
          };
        }

        return null;
      })
      .filter((section): section is DocSection => section !== null);
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 font-sans">
      {/* Banner/Header */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-12 px-6 sm:px-8">
        {/* Decorative glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-50 border border-blue-100 dark:border-blue-800/40 text-xs px-3 py-1 font-semibold rounded-full">
            Knowledge Base
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
            CallPilot Helps Documentation
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base mb-8">
            Step-by-step visuals and instructions to set up your AI numbers, build call flows, hook up recruitment integrations, and read transcript reports.
          </p>

          {/* Search Input Container */}
          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search helps topics, features, buttons or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-6 w-full rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sticky Sidebar (Table of Contents) - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 tracking-wider px-3 mb-3">
                  Document Sections
                </h3>
                <nav className="space-y-1">
                  {docSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleScrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"} />
                        <span className="flex-1 truncate">{section.title}</span>
                        <ChevronRight size={14} className={`transition-transform duration-200 ${isActive ? "rotate-90 text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar content spacer */}
            </div>
          </div>

          {/* Right Contents Area */}
          <div className="col-span-1 lg:col-span-3 space-y-12">
            {filteredSections.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl">
                <HelpCircle size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Results Found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                  We couldn't find any documentation match for &ldquo;{searchQuery}&rdquo;. Try checking the spelling or using broader search terms.
                </p>
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="rounded-xl"
                >
                  Clear Search Filter
                </Button>
              </Card>
            ) : (
              filteredSections.map((section) => (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="scroll-mt-6 space-y-8"
                >
                  {/* Section Title Block */}
                  <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
                        <section.icon size={20} />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      {section.description}
                    </p>
                  </div>

                  {/* Screens inside Section */}
                  <div className="space-y-12">
                    {section.screens.map((screen) => (
                      <Card
                        key={screen.id}
                        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl overflow-hidden"
                      >
                        <div className="p-6 sm:p-8 space-y-6">
                          
                          {/* Screen Name Header */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 text-[10px] font-semibold uppercase tracking-wider rounded-md">
                                Screen Guide
                              </Badge>
                              <h3 className="text-md sm:text-lg font-bold text-gray-900 dark:text-white">
                                {screen.name}
                              </h3>
                            </div>
                          </div>

                          {/* Annotated Screenshot */}
                          <div className="relative">
                            <AnnotatedScreenshot
                              src={screen.screenshot}
                              alt={screen.name}
                              arrows={screen.arrows}
                            />
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            
                            {/* Left Col: Purpose & Steps */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-1.5">
                                  What is this screen?
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                  {screen.purpose}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-2">
                                  How to use it:
                                </h4>
                                <ol className="space-y-2">
                                  {screen.steps.map((step, idx) => (
                                    <li key={idx} className="flex gap-2.5 items-start text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-normal">
                                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100/50 dark:border-blue-800/10 flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
                                      <span className="flex-1">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </div>

                            {/* Right Col: Important Actions */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-1">
                                Important Actions
                              </h4>
                              <div className="space-y-3">
                                {screen.actions.map((action, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                                  >
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                      <CheckCircle2 size={13} className="text-emerald-500" />
                                      {action.name}
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-4.5">
                                      {action.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                          
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {/* End of documentation sections */}

          </div>
        </div>
      </div>
    </div>
  );
}
