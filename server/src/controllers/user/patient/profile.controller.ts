import { type Request, type Response } from 'express'
import { prisma } from '../../../db/db.js'
import { getUserDisplayName } from '../../../utils/userDisplay.js'

const BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN'] as const

type BloodGroupInput = (typeof BLOOD_GROUPS)[number]

const createPatientId = () => `PT-${Date.now().toString(36).toUpperCase()}`

const serializePatientProfile = (profile: Awaited<ReturnType<typeof prisma.patientProfile.findUnique>> & { user?: never }) => profile

export const getMyPatientProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { patientProfile: true },
    })

    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    let profile = user.patientProfile
    if (!profile) {
      profile = await prisma.patientProfile.create({
        data: { userId: user.id, patientId: createPatientId() },
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        id: profile.id,
        patientId: profile.patientId,
        fullName: getUserDisplayName(user),
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        alternatePhone: user.alternatePhone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
        bloodGroup: user.bloodGroup,
        profileImage: user.profileImage,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactPhone: profile.emergencyContactPhone,
        emergencyRelationship: profile.emergencyRelationship,
        knownAllergies: profile.knownAllergies,
        chronicConditions: profile.chronicConditions,
        medicalNotes: profile.medicalNotes,
      },
    })
  } catch (error) {
    console.error('Get patient profile error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export const updateMyPatientProfile = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      phone,
      alternatePhone,
      dateOfBirth,
      bloodGroup,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      emergencyContactName,
      emergencyContactPhone,
      emergencyRelationship,
      knownAllergies,
      chronicConditions,
      medicalNotes,
    } = req.body as Record<string, string | null | undefined>

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, field: 'firstName', message: 'First name is required' })
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, field: 'phone', message: 'Phone number is required' })
    }
    if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup as BloodGroupInput)) {
      return res.status(400).json({ success: false, field: 'bloodGroup', message: `Blood group must be one of: ${BLOOD_GROUPS.join(', ')}` })
    }

    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null
    if (dateOfBirth && parsedDob && Number.isNaN(parsedDob.getTime())) {
      return res.status(400).json({ success: false, field: 'dateOfBirth', message: 'Invalid date of birth' })
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.user!.id },
        data: {
          firstName: firstName.trim(),
          middleName: middleName?.trim() || null,
          lastName: lastName?.trim() || null,
          phone: phone.trim(),
          alternatePhone: alternatePhone?.trim() || null,
          dateOfBirth: parsedDob,
          bloodGroup: (bloodGroup as BloodGroupInput) || null,
          addressLine1: addressLine1?.trim() || null,
          addressLine2: addressLine2?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          country: country?.trim() || null,
          postalCode: postalCode?.trim() || null,
        },
      })

      const patientProfile = await tx.patientProfile.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          patientId: createPatientId(),
          emergencyContactName: emergencyContactName?.trim() || null,
          emergencyContactPhone: emergencyContactPhone?.trim() || null,
          emergencyRelationship: emergencyRelationship?.trim() || null,
          knownAllergies: knownAllergies?.trim() || null,
          chronicConditions: chronicConditions?.trim() || null,
          medicalNotes: medicalNotes?.trim() || null,
        },
        update: {
          emergencyContactName: emergencyContactName?.trim() || null,
          emergencyContactPhone: emergencyContactPhone?.trim() || null,
          emergencyRelationship: emergencyRelationship?.trim() || null,
          knownAllergies: knownAllergies?.trim() || null,
          chronicConditions: chronicConditions?.trim() || null,
          medicalNotes: medicalNotes?.trim() || null,
        },
      })

      return { user, patientProfile }
    })

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: result.patientProfile.id,
        patientId: result.patientProfile.patientId,
        fullName: getUserDisplayName(result.user),
      },
    })
  } catch (error) {
    console.error('Update patient profile error:', error)
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
