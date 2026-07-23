import { describe, expect, it } from 'vitest'
import { applicationInput, enquiryInput } from './schemas'

describe('public submission schemas', () => {
  it('accepts a minimal valid enquiry and private attachment metadata', () => {
    const parsed = enquiryInput.parse({
      name: 'Sam Lee',
      phone: '672-377-1944',
      email: 'sam@example.com',
      preferredContact: 'email',
      projectType: 'residential',
      stage: 'Planning',
      services: ['painting'],
      location: 'Surrey',
      timeline: 'Flexible',
      description: 'A complete, useful project description.',
      attachments: [
        {
          publicId: 'private/inquiry/file',
          resourceType: 'image',
          bytes: 1024,
          originalFilename: 'room.jpg',
        },
      ],
    })
    expect(parsed.attachments).toHaveLength(1)
  })

  it('rejects application submissions without a private resume', () => {
    expect(() =>
      applicationInput.parse({
        openingSlug: 'crew',
        name: 'Sam Lee',
        phone: '672-377-1944',
        email: 'sam@example.com',
        city: 'Surrey',
        experience: 'Several years in drywall finishing.',
        years: '4–7 years',
        availability: 'Immediately',
        workAuthorization: true,
        transport: 'Own reliable transport',
        supportingFiles: [],
      }),
    ).toThrow()
  })
})
