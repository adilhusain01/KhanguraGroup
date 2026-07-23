import {
  IconBrush,
  IconBuildingWarehouse,
  IconColumns3,
  IconLayersSubtract,
  IconRulerMeasure,
} from '@tabler/icons-react'

export type ServiceKey = 'framing' | 'mudding' | 'insulation' | 'painting' | 'concrete'

export const services = [
  { key: 'framing' as const, number: '01', name: 'Steel Stud Framing', short: 'Structure', icon: IconColumns3, description: 'Layout-led metal stud systems for spaces that need a clear, dependable structure.' },
  { key: 'mudding' as const, number: '02', name: 'Drywall Taping & Mudding', short: 'Finish prep', icon: IconLayersSubtract, description: 'A disciplined finishing process designed around clean lines, consistency, and readiness for the next trade.' },
  { key: 'insulation' as const, number: '03', name: 'Insulation', short: 'Envelope', icon: IconBuildingWarehouse, description: 'Practical insulation work coordinated with the build sequence and project requirements.' },
  { key: 'painting' as const, number: '04', name: 'Painting', short: 'Final finish', icon: IconBrush, description: 'Careful preparation and a controlled finish for residential and commercial interiors.' },
  { key: 'concrete' as const, number: '05', name: 'Concrete Services', short: 'Groundwork', icon: IconRulerMeasure, description: 'Concrete work planned around site conditions, access, finish requirements, and schedule.' },
]

export const projects = [
  { slug: 'surrey-residential-interior', title: 'Surrey Residential Interior', type: 'Residential', city: 'Surrey', services: ['Framing', 'Mudding', 'Painting'], status: 'Draft case study', overview: 'A structured case-study template ready for approved project imagery, scope, and outcome details.' },
  { slug: 'lower-mainland-commercial-buildout', title: 'Lower Mainland Commercial Buildout', type: 'Commercial', city: 'Lower Mainland', services: ['Framing', 'Insulation'], status: 'Draft case study', overview: 'A commercial showcase shell designed for the client-approved project narrative and gallery.' },
  { slug: 'concrete-finish-program', title: 'Concrete Finish Program', type: 'Commercial', city: 'Surrey', services: ['Concrete'], status: 'Draft case study', overview: 'A project record that can document challenge, execution, finish, and project-specific results.' },
]

export const faqs = [
  ['What types of projects do you take on?', 'Khangura Group supports residential and commercial work across its listed construction and finishing services. The team will confirm project fit, schedule, and scope during the enquiry process.'],
  ['Which areas do you serve?', 'The company serves Surrey and the Lower Mainland. Provide your city or postal code with your enquiry so site access and project fit can be reviewed.'],
  ['Can I request more than one service?', 'Yes. Select every relevant service in the quote form. Grouping work can help make coordination clearer, but availability and scope are always confirmed individually.'],
  ['What should I include with my enquiry?', 'A brief description, project city, timing, and any relevant photos or drawings help the team understand the work. Attachments are stored privately and are not shared by WhatsApp.'],
]

export const jobs = [
  { slug: 'construction-finishing-crew', title: 'Construction & Finishing Crew', type: 'Full-time / project-based', location: 'Surrey & Lower Mainland', summary: 'Expression-of-interest opening for skilled construction and finishing professionals.' },
]

export const phoneHref = 'tel:+16723771944'
export const emailHref = 'mailto:khangura.group.of.companies.inc@gmail.com'
export const whatsappHref = 'https://wa.me/16723771944'
