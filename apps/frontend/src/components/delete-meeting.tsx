import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { orpcClient } from '@/utils/orpc'

interface DeleteMeetingProps {
  meetingId: string
  meetingTitle: string
  variant?: 'button' | 'icon'
  size?: 'sm' | 'default' | 'lg'
  onDelete?: () => void
}

export function DeleteMeeting({
  meetingId,
  meetingTitle,
  variant = 'button',
  size = 'default',
  onDelete,
}: DeleteMeetingProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const deleteMeetingMutation = useMutation({
    mutationFn: async () => {
      return await orpcClient.meetings.delete({ meetingId })
    },
    onSuccess: () => {
      toast.success('Meeting deleted successfully')
      if (onDelete) {
        onDelete()
      } else {
        navigate({ to: '/dashboard' })
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete meeting: ${error.message}`)
    },
  })

  const handleDelete = () => {
    deleteMeetingMutation.mutate()
    setOpen(false)
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            size="sm"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="flex items-center gap-2"
            size={size}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Meeting
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{meetingTitle}"? This action cannot
            be undone. All associated files, summaries, action items, and
            comments will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMeetingMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMeetingMutation.isPending ? 'Deleting...' : 'Delete Meeting'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
